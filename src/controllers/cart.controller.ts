import { Request, Response } from "express";
import { prismaClient } from "../server";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { checkUserId } from "../utils/check-userid";
import { UserService } from "../services/user.service";
import { CartService } from "../services/cart.service";

export const createCart = async (req: Request, res: Response) => {
	try {
		const { productId, quantity } = req.body;
		const token = req.headers["authorization"];

		if (!productId || quantity === undefined) {
			return res.status(400).json({
				success: false,
				error: "Product ID and quantity are required",
			});
		}

		if (!token) {
			return res.status(400).json({
				success: false,
				error: "User must be logged in",
			});
		}

		const userId = checkUserId(token as string);

		const user = await UserService.findOneById(userId);
		if (!user) {
			return res.status(400).json({
				success: false,
				error: "user not found",
			});
		}
		let existingCart = await prismaClient.cart.findUnique({
			where: { userId },
		});

		if (!existingCart) {
			existingCart = await prismaClient.cart.create({
				data: { userId },
			});
		}

		let cartItem = await prismaClient.cartItem.findFirst({
			where: {
				cartId: existingCart.id,
				productId,
			},
		});

		const product = await prismaClient.product.findUniqueOrThrow({
			where: { id: productId },
		});

		if (product?.outOfStock) {
			return res.status(400).json({
				success: false,
				error: "Product is out of stock",
			});
		}

		if (cartItem) {
			const newQuantity = cartItem.quantity + quantity;

			if (quantity > 0 && newQuantity > product.stockCount) {
				return res.status(400).json({
					success: false,
					error: `Cannot add more items. Available stock: ${product.stockCount}, Current in cart: ${cartItem.quantity}`,
				});
			}

			if (newQuantity < 1) {
				await prismaClient.cartItem.delete({
					where: { id: cartItem.id },
				});

				const updatedCart = await prismaClient.cartItem.aggregate({
					_sum: { totalPrice: true },
					where: { cartId: existingCart.id },
				});

				await prismaClient.cart.update({
					where: { id: existingCart.id },
					data: { totalAmount: updatedCart._sum.totalPrice || 0 },
				});

				return res.status(200).json({
					success: true,
					message: "Cart item deleted successfully",
				});
			} else {
				const updatedCartItem = await prismaClient.cartItem.update({
					where: { id: cartItem.id },
					data: {
						quantity: newQuantity,
						totalPrice: product.price! * newQuantity,
					},
				});

				return res.status(200).json({
					success: true,
					message: "Cart item quantity updated successfully",
					data: updatedCartItem,
				});
			}
		} else {
			if (quantity > product.stockCount) {
				return res.status(400).json({
					success: false,
					error: `Cannot add ${quantity} items. Available stock: ${product.stockCount}`,
				});
			}

			const newCartItem = await prismaClient.cartItem.create({
				data: {
					productId: product.id,
					quantity,
					cartId: existingCart.id,
					totalPrice: (product.price ?? 0) * quantity,
				},
			});

			return res.status(201).json({
				success: true,
				message: "Product successfully added to cart",
				data: newCartItem,
			});
		}
	} catch (error) {
		if (
			error instanceof PrismaClientKnownRequestError &&
			error.code === "P2025"
		) {
			return res.status(404).json({
				success: false,
				error: "Product not found",
			});
		}

		return res.status(500).json({
			success: false,
			message: "An error occurred while creating or updating the cart",
		});
	}
};

export const getAllCartItems = async (req: Request, res: Response) => {
	try {
		const data = await CartService.findAll();
		res
			.status(200)
			.json({ status: "success", results: data?.length, data: data });
	} catch (error) {
		res
			.status(400)
			.json({ status: "failure", message: `something went wrong` });
	}
};

export const getAllCartByUser = async (req: Request, res: Response) => {
	try {
		const token = req.headers["authorization"];

		const userId = checkUserId(token as string);

		if (!userId) {
			return res.status(400).json({
				success: false,
				error: "User Not Found",
			});
		}

		const userCart = await prismaClient.cart.findUnique({
			where: { userId: userId },
			include: {
				CartItem: {
					orderBy: {
						product: {
							name: "asc",
						},
					},
					include: {
						product: true,
					},
				},
			},
		});
		const totalPrice = userCart?.CartItem.reduce(
			(acc, item) => acc + item.totalPrice,
			0
		);

		if (!userCart) {
			return res
				.status(200)
				.json({ success: false, message: "Cart not found" });
		}

		res.status(200).json({
			status: "success",
			data: {
				...userCart,
				totalAmount: totalPrice,
			},
		});
	} catch (error) {
		res.status(500).json({ success: false, error: `something went wrong` });
	}
};

export const deleteCart = async (req: Request, res: Response) => {
	const { cartItemId } = req.params;
	const token = req.headers["authorization"];
	const userId = checkUserId(token as string);

	try {
		const cart = await prismaClient.cart.findUnique({
			where: { userId: userId },
			include: { CartItem: true },
		});

		if (!cart) {
			return res.status(404).json({
				success: false,
				error: "Cart not found",
			});
		}

		const cartItem = await prismaClient.cartItem.findFirst({
			where: {
				id: cartItemId,
				cartId: cart.id,
			},
		});

		if (!cartItem) {
			return res.status(404).json({
				success: false,
				error: "Cart item not found",
			});
		}

		await prismaClient.cartItem.delete({
			where: { id: cartItemId },
		});

		const remainingItems = await prismaClient.cartItem.count({
			where: { cartId: cart.id },
		});

		if (remainingItems === 0) {
			await prismaClient.cart.delete({
				where: { id: cart.id },
			});
		} else {
			const updatedCart = await prismaClient.cartItem.aggregate({
				_sum: { totalPrice: true },
				where: { cartId: cart.id },
			});

			await prismaClient.cart.update({
				where: { id: cart.id },
				data: {
					totalAmount: updatedCart._sum.totalPrice || 0,
				},
			});
		}

		return res.status(200).json({
			success: true,
			message: "Cart item deleted successfully",
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: "Error deleting cart item",
		});
	}
};
export const updateCart = async (req: Request, res: Response) => {
	const { cartItemId, quantity } = req.body;
	const token = req.headers["authorization"];
	const userId = checkUserId(token as string);

	if (!quantity || typeof quantity !== "number") {
		return res.status(400).json({
			success: false,
			message: "Quantity change must be a valid number",
		});
	}

	try {
		const cart = await prismaClient.cart.findUnique({
			where: { userId: userId },
			include: { CartItem: true },
		});

		if (!cart) {
			return res.status(200).json({
				success: false,
				message: "Cart not found",
			});
		}

		const cartItem = await prismaClient.cartItem.findFirst({
			where: {
				id: cartItemId,
				cartId: cart.id,
			},
		});

		if (!cartItem) {
			return res.status(404).json({
				success: false,
				message: "Cart item not found",
			});
		}

		const product = await prismaClient.product.findFirstOrThrow({
			where: { id: cartItem.productId! },
		});

		if (product?.outOfStock) {
			return res.status(400).json({
				success: false,
				error: "Product is out of stock",
			});
		}

		const newQuantity = cartItem.quantity + quantity;

		if (quantity > 0 && newQuantity > product.stockCount) {
			return res.status(400).json({
				success: false,
				error: `Cannot add more items. Available stock: ${product.stockCount}, Current in cart: ${cartItem.quantity}`,
			});
		}

		if (newQuantity < 1) {
			await prismaClient.cartItem.delete({
				where: { id: cartItem.id },
			});

			const updatedCart = await prismaClient.cartItem.aggregate({
				_sum: { totalPrice: true },
				where: { cartId: cart.id },
			});

			await prismaClient.cart.update({
				where: { id: cart.id },
				data: {
					totalAmount: updatedCart._sum.totalPrice || 0,
				},
			});

			return res.status(200).json({
				success: true,
				message: "Cart item deleted successfully",
			});
		}

		const updatedTotalPrice = product.price! * newQuantity;

		await prismaClient.cartItem.update({
			where: { id: cartItem.id },
			data: {
				quantity: newQuantity,
				totalPrice: updatedTotalPrice,
			},
		});

		const updatedCart = await prismaClient.cartItem.aggregate({
			_sum: { totalPrice: true },
			where: { cartId: cart.id },
		});

		await prismaClient.cart.update({
			where: { id: cart.id },
			data: {
				totalAmount: updatedCart._sum.totalPrice || 0,
			},
		});

		return res.status(200).json({
			success: true,
			message: "Cart item quantity updated successfully",
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Error updating cart item quantity",
		});
	}
};
