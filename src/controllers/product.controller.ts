import { Request, Response } from "express";
import { prismaClient } from "../server";
import { checkUserId } from "../utils/check-userid";

export const createProduct = async (req: Request, res: Response) => {
	const {
		name,
		descriptions,
		price,
		categoryId,
		outOfStock,
		imageUrl,
		isFreeDelivery,
		stockCount
	} = req?.body;

	if (!name || !categoryId || !price) {
		return res.status(400).json({
			success: false,
			message: "Missing required fields: name, categoryId, unit, or price",
		});
	}

	const token = req.headers["authorization"];
	if (!token) {
		return res.status(401).json({
			success: false,
			message: "User must be logged in",
		});
	}

	try {
		const userId = checkUserId(token as string);
		if (!userId) {
			return res.status(401).json({
				success: false,
				message: "Invalid or expired token",
			});
		}

		const userDetails = await prismaClient.user.findUnique({
			where: { id: userId },
		});

		if (!userDetails) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		if (userDetails?.role === "USER") {
			return res.status(401).json({
				success: false,
				message: "unauthorized",
			});
		}
		const category = await prismaClient.category.findUnique({
			where: { id: categoryId },
		});

		if (!category) {
			return res.status(400).json({
				success: false,
				message: "Invalid category ID",
			});
		}

		const product = await prismaClient.product.create({
			data: {
				name,
				descriptions,
				price,
				categoryId,
				outOfStock: outOfStock || false,
				imageUrl,
				isFreeDelivery: isFreeDelivery || false,
				stockCount
			},
		});

		res.status(201).json({
			success: true,
			message: "Product created successfully",
			data: product,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Something went wrong while creating the product",
		});
	}
};

export const getAllProductByUser = async (req: Request, res: Response) => {
	const { page = 1, limit = 10, search } = req.query;
	const pageNumber = Number(page);
	const limitNumber = Number(limit);

	const token = req.headers["authorization"];

	const userId = checkUserId(token as string);
	if (!token) {
		return res.status(401).json({
			success: false,
			message: "User must be logged in",
		});
	}

	const userDetails = await prismaClient.user.findFirst({
		where: {
			id: userId,
		},
	});

	if (userDetails?.role === "USER") {
		return res.status(401).json({
			success: false,
			error: "authorized",
		});
	}

	try {
		const searchCondition: any = {};
		if (search) {
			searchCondition.name = {
				contains: search as string,
				mode: "insensitive",
			};
		}

		const totalProduct = await prismaClient.product.count({
			where: searchCondition,
		});

		const data = await prismaClient.product.findMany({
			where: searchCondition,
			skip: (pageNumber - 1) * limitNumber,
			take: limitNumber,
		});
		res.status(200).json({
			status: "success",
			results: data?.length,
			data: data,
			meta: {
				totalProduct,
				currentPage: pageNumber,
				totalPages: Math.ceil(totalProduct / limitNumber),
			},
		});
	} catch (error) {
		console.log("error", error);
		res
			.status(400)
			.json({ status: "failure", message: `something went wrong` });
	}
};
export const getProductById = async (req: Request, res: Response) => {
	const { id } = req.params;
	const product = await prismaClient.product.findUnique({
		where: { id },
		include: {
			category: {
				select: {
					name: true,
					id: true,
				},
			},
		},
	});
	res.status(200).json({ status: "success", data: product });
};

export const getAllProduct = async (req: Request, res: Response) => {
	const { page = 1, limit = 10, search } = req.query;
	const pageNumber = Number(page);
	const limitNumber = Number(limit);
	try {
		const searchCondition: any = {};
		if (search) {
			searchCondition.name = {
				contains: search as string,
				mode: "insensitive",
			};
		}

		const totalProduct = await prismaClient.product.count({
			where: searchCondition,
		});
		const data = await prismaClient.product.findMany({
			where: searchCondition,
			skip: (pageNumber - 1) * limitNumber,
			take: limitNumber,
			include: {
				category: {
					select: {
						name: true,
						id: true,
					},
				},
			},
		});
		res.status(200).json({
			status: "success",
			results: data?.length,
			data: data,
			meta: {
				totalProduct,
				currentPage: pageNumber,
				totalPages: Math.ceil(totalProduct / limitNumber),
			},
		});
	} catch (error) {
		res
			.status(400)
			.json({ status: "failure", message: `something went wrong` });
	}
};
export const getProductByUser = async (req: Request, res: Response) => {
	try {
		const response = await prismaClient.product.findMany({
			include: {
				category: {
					select: {
						name: true,
						id: true,
					},
				},
			},
		});
		res.status(200).json({ status: "success", data: response });
	} catch (error) {
		res
			.status(500)
			.json({ status: "failure", error: `Failed to delete product` });
	}
};

export const deleteProduct = async (req: Request, res: Response) => {
	try {
		const productId = String(req?.params?.id);

		await prismaClient.product.delete({
			where: {
				id: productId,
			},
		});

		res
			.status(200)
			.json({ status: "success", message: "product deleted successfully" });
	} catch (error) {
		console.log("error", error);
		res
			.status(500)
			.json({ status: "failure", error: `Failed to delete product` });
	}
};

export const updateProduct = async (req: Request, res: Response) => {
	const {
		name,
		code,
		descriptions,
		price,
		categoryId,
		outOfStock,
		imageUrl,
		isFreeDelivery,
		stockCount
	} = req.body;

	const token = req.headers["authorization"];
	if (!token) {
		return res.status(401).json({
			success: false,
			message: "Authorization token is required",
		});
	}

	try {
		const userId = checkUserId(token as string);
		if (!userId) {
			return res.status(401).json({
				success: false,
				message: "Invalid or expired token",
			});
		}

		const userDetails = await prismaClient.user.findFirst({
			where: {
				id: userId,
			},
		});

		if (userDetails?.role === "USER") {
			return res.status(401).json({
				success: false,
				error: "unauthorized",
			});
		}

		const product = await prismaClient.product.findUnique({
			where: { id: req.params.id },
		});

		if (!product) {
			return res.status(404).json({
				success: false,
				message: "Product not found",
			});
		}

		if (categoryId) {
			const categoryExists = await prismaClient.category.findUnique({
				where: { id: categoryId },
			});

			if (!categoryExists) {
				return res.status(400).json({
					success: false,
					message: "Invalid category ID",
				});
			}
		}

		const updatedProduct = await prismaClient.product.update({
			where: { id: req.params.id },
			data: {
				name: name || product.name,
				code: code || product.code,
				descriptions: descriptions || product.descriptions,
				price: price || product.price,
				categoryId: categoryId || product.categoryId,
				outOfStock: outOfStock !== undefined ? outOfStock : product.outOfStock,
				isFreeDelivery: isFreeDelivery || false,
				imageUrl: imageUrl || product.imageUrl,
				stockCount: stockCount || product.stockCount,
			},
		});

		res.status(200).json({
			success: true,
			message: "Product updated successfully",
			data: updatedProduct,
		});
	} catch (error) {
		console.error("Error updating product:", error);
		res.status(500).json({
			success: false,
			message: "An error occurred while updating the product",
		});
	}
};

export const getCategoryWithProductParams = async (
	req: Request,
	res: Response
) => {
	const { categoryId, page = 1, limit = 20, search } = req.query;

	const pageNumber = parseInt(page as string, 10);
	const limitNumber = parseInt(limit as string, 10);
	const skip = (pageNumber - 1) * limitNumber;

	try {
		let searchFilter: any = {};
		if (search) {
			searchFilter = {
				OR: [
					{
						name: {
							contains: search.toString().toLowerCase(),
							mode: "insensitive",
						},
					},
					{
						code: {
							contains: search.toString().toLowerCase(),
							mode: "insensitive",
						},
					},
					{
						descriptions: {
							contains: search.toString().toLowerCase(),
							mode: "insensitive",
						},
					},
				],
			};
		}

		if (categoryId) {
			const products = await prismaClient.product.findMany({
				where: {
					categoryId: categoryId.toString(),
					...searchFilter,
				},
				select: {
					id: true,
					price: true,
					descriptions: true,
					name: true,
					code: true,
					imageUrl: true,
					outOfStock: true,
					category: {
						select: {
							name: true,
						},
					},
				},
				skip,
				take: limitNumber,
			});

			const totalProducts = await prismaClient.product.count({
				where: {
					categoryId: categoryId.toString(),
					...searchFilter,
				},
			});

			const totalPages = Math.ceil(totalProducts / limitNumber);

			return res.status(200).json({
				success: true,
				data: products,
				totalProducts,
				totalPages: products?.length > 0 ? totalPages : 1,
				currentPage: pageNumber,
			});
		} else {
			const products = await prismaClient.product.findMany({
				where: searchFilter,
				select: {
					id: true,
					price: true,
					descriptions: true,
					imageUrl: true,
					name: true,
					code: true,
					outOfStock: true,
					stockCount: true,
					category: {
						select: {
							name: true,
						},
					},
				},
				skip,
				take: limitNumber,
			});

			const totalProducts = await prismaClient.product.count({
				where: searchFilter,
			});

			const totalPages = Math.ceil(totalProducts / limitNumber);

			return res.status(200).json({
				success: true,
				data: products,
				totalProducts,
				totalPages,
				currentPage: pageNumber,
			});
		}
	} catch (error) {
		console.error("Error fetching product:", error);
		res.status(500).json({ message: "Internal Server Error" });
	}
};
