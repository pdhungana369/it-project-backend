import { Request, Response } from "express";
import { prismaClient } from "../server";
import { checkUserId } from "../utils/check-userid";

function generateUniqueOrderId() {
	const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	const randomLetter =
		characters[Math.floor(Math.random() * characters.length)];
	const uniqueOrderId = Math.floor(100000 + Math.random() * 900000).toString();
	return `${randomLetter}${uniqueOrderId}`;
}

export const createOrder = async (req: Request, res: Response) => {
	try {
		const { recipientAddress, recipientName, recipientPhoneNumber } = req.body;

		const token = req.headers["authorization"];
		if (!token) {
			return res.status(400).json({
				success: false,
				message: "User must be logged in",
			});
		}

		const userId = checkUserId(token as string);
		const userDetails = await prismaClient.user.findFirst({
			where: { id: userId },
		});
		if (!userDetails) {
			return res.status(400).json({
				error: "User not found",
			});
		}

		const cart = await prismaClient.cart.findUnique({
			where: { userId: userDetails?.id },
			include: { CartItem: { include: { product: true } } },
		});

		if (!cart || cart.CartItem.length === 0) {
			return res.status(400).json({
				success: false,
				error: "No items found in cart",
			});
		}

		for (const cartItem of cart.CartItem) {
			const product = cartItem.product;
			if (!product) {
				return res.status(400).json({
					success: false,
					error: `Product not found for cart item`,
				});
			}

			if (product.stockCount < cartItem.quantity) {
				return res.status(400).json({
					success: false,
					error: `Insufficient stock for product: ${product.name}. Available: ${product.stockCount}, Requested: ${cartItem.quantity}`,
				});
			}
		}

		const totalAmount = cart.CartItem.reduce((sum, cartItem) => {
			const itemTotal = (cartItem.product?.price || 0) * cartItem.quantity;
			return sum + itemTotal;
		}, 0);

		const createdOrder = await prismaClient.$transaction(async (prisma) => {
			const newOrder = await prisma.order.create({
				data: {
					userId: userDetails?.id,
					status: "PENDING",
					orderId: generateUniqueOrderId(),
					totalAmount: totalAmount.toString(),
					recipientAddress,
					recipientName,
					recipientPhoneNumber,
				},
			});
			const orderItems = await Promise.all(
				cart.CartItem.map(async (cartItem) => {
					return prisma.orderItem.create({
						data: {
							orderId: newOrder.id,
							productId: cartItem.productId!,
							quantity: cartItem.quantity,
						},
					});
				})
			);

			await Promise.all(
				cart.CartItem.map(async (cartItem) => {
					const product = await prisma.product.findUnique({
						where: { id: cartItem.productId! },
						select: { stockCount: true, name: true },
					});

					if (!product) {
						throw new Error(`Product with ID ${cartItem.productId} not found`);
					}

					if (product.stockCount < cartItem.quantity) {
						throw new Error(
							`Insufficient stock for product: ${product.name}. Available: ${product.stockCount}, Requested: ${cartItem.quantity}`
						);
					}

					await prisma.product.update({
						where: { id: cartItem.productId! },
						data: {
							stockCount: {
								decrement: cartItem.quantity,
							},
							outOfStock: product.stockCount - cartItem.quantity === 0,
						},
					});
				})
			);

			await prisma.cartItem.deleteMany({
				where: { cartId: cart.id },
			});

			await prisma.cart.update({
				where: { id: cart.id },
				data: { totalAmount: 0 },
			});

			return { newOrder, orderItems };
		});

		res.status(201).json({
			success: true,
			message: "Order created successfully",
			data: createdOrder,
		});
	} catch (error) {
		console.error("Error creating order", error);
		res.status(500).json({ success: false, message: "Something went wrong" });
	}
};

export const updateOrderStatus = async (req: Request, res: Response) => {
	try {
		const { orderId, status } = req.body;

		if (!["PENDING", "DISPATCHED", "COMPLETED", "CANCELED"].includes(status)) {
			return res.status(400).json({
				success: false,
				message: "Invalid order status",
			});
		}

		const currentOrder = await prismaClient.order.findUnique({
			where: { id: orderId },
			include: {
				OrderItem: {
					include: {
						product: true,
					},
				},
			},
		});

		if (!currentOrder) {
			return res.status(404).json({
				success: false,
				message: "Order not found",
			});
		}

		if (status === "CANCELED" && currentOrder.status !== "CANCELED") {
			await prismaClient.$transaction(async (prisma) => {
				await Promise.all(
					currentOrder.OrderItem.map(async (orderItem) => {
						await prisma.product.update({
							where: { id: orderItem.productId },
							data: {
								stockCount: {
									increment: orderItem.quantity,
								},
								outOfStock: false,
							},
						});
					})
				);

				await prisma.order.update({
					where: { id: orderId },
					data: {
						status: status,
					},
				});
			});
		} else {
			await prismaClient.order.update({
				where: { id: orderId },
				data: {
					status: status,
				},
			});
		}

		res.status(200).json({
			success: true,
			message: `Order status updated to ${status}`,
		});
	} catch (error) {
		console.error("Error updating order status", error);
		res.status(500).json({ success: false, message: "Something went wrong" });
	}
};

export const getAllOrderAdmin = async (req: Request, res: Response) => {
	const { page = 1, limit = 10, search } = req.query;
	const pageNumber = Number(page);
	const limitNumber = Number(limit);

	try {
		const searchCondition: any = {};

		if (search) {
			searchCondition.orderId = {
				contains: search as string,
				mode: "insensitive",
			};
		}

		const totalOrders = await prismaClient.order.count({
			where: searchCondition,
		});

		const orders = await prismaClient.order.findMany({
			where: searchCondition,
			skip: (pageNumber - 1) * limitNumber,
			take: limitNumber,
			select: {
				id: true,
				orderId: true,
				OrderItem: {
					include: {
						product: true,
					},
				},
				totalAmount: true,
				status: true,
				createdAt: true,
				recipientAddress: true,
				recipientName: true,
				recipientPhoneNumber: true,
				User: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
		});

		if (orders.length === 0) {
			return res.status(404).json({
				success: false,
				message: "No orders found",
			});
		}

		const ordersWithTotals = orders.map((order) => {
			const totalQuantity = order.OrderItem.reduce((sum: number, item: any) => {
				return sum + item.quantity;
			}, 0);

			return {
				...order,
				totalQuantity,
			};
		});

		res.status(200).json({
			success: true,
			message: "Orders retrieved successfully",
			data: ordersWithTotals,
			meta: {
				totalOrders,
				currentPage: pageNumber,
				totalPages: Math.ceil(totalOrders / limitNumber),
			},
		});
	} catch (error) {
		console.error("Error fetching orders", error);
		res.status(500).json({
			success: false,
			message: "Something went wrong",
		});
	}
};

export const getOrderById = async (req: Request, res: Response) => {
	try {
		const { id: orderId } = req.params;

		const order = await prismaClient.order.findUnique({
			where: {
				id: orderId,
			},

			include: {
				OrderItem: {
					include: {
						product: {
							select: {
								price: true,
								name: true,
								imageUrl: true,
								category: {
									select: {
										name: true,
									},
								},
							},
						},
					},
					orderBy: {
						createdAt: "desc",
					},
				},
				User: {
					select: {
						email: true,
						name: true,
					},
				},
			},
		});

		if (!order) {
			return res.status(404).json({
				success: false,
				message: "Order not found",
			});
		}

		const totalPrice = order.OrderItem.reduce((sum: number, item: any) => {
			return sum + item.product.price! * item.quantity;
		}, 0);

		const totalQuantity = order.OrderItem.reduce((sum: number, item: any) => {
			return sum + item.quantity;
		}, 0);

		const orderDetails = {
			...order,
			totalPrice,
			totalQuantity,
		};

		res.status(200).json({
			success: true,
			message: "Order details retrieved successfully",
			data: orderDetails,
		});
	} catch (error) {
		console.error("Error fetching order details", error);
		res.status(500).json({
			success: false,
			message: "Something went wrong",
		});
	}
};

export const getOrderDetails = async (req: Request, res: Response) => {
	try {
		const token = req.headers["authorization"];
		if (!token) {
			return res.status(400).json({
				success: false,
				message: "User must be logged in",
			});
		}
		const userId = checkUserId(token as string);
		const orderDetails = await prismaClient.order.findMany({
			where: { userId },
			include: {
				OrderItem: {
					include: {
						product: {
							select: {
								price: true,
								name: true,
								imageUrl: true,
								category: {
									select: {
										name: true,
									},
								},
							},
						},
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		const ordersWithTotals = orderDetails.map((order) => {
			const totalPrice = order.OrderItem.reduce((sum: number, item: any) => {
				return sum + item.product.price! * item.quantity;
			}, 0);

			const totalQuantity = order.OrderItem.reduce((sum: number, item: any) => {
				return sum + item.quantity;
			}, 0);

			return {
				...order,
				totalPrice,
				totalQuantity,
			};
		});

		res.status(200).json({
			success: true,
			message: "Order details retrieved successfully",
			data: ordersWithTotals,
		});
	} catch (error) {
		console.error("Error fetching order details", error);
		res.status(500).json({
			success: false,
			message: "Something went wrong",
		});
	}
};
