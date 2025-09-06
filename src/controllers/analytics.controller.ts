import { Request, Response } from "express";
import { prismaClient } from "../server";

export const getAnalytics = async (req: Request, res: Response) => {
	try {
		const outOfStockCount = await prismaClient.product.count({
			where: {
				outOfStock: true,
			},
		});
		const outOfStockCountList = await prismaClient.product.findMany({
			where: {
				outOfStock: true,
			},
			select: {
				name: true,
				id: true,
				price: true,
				imageUrl: true,
				category: {
					select: {
						name: true,
					},
				},
			},
		});

		const totalProducts = await prismaClient.product.count();

		const totalOrderProducts = await prismaClient.order.count();

		const totalUsers = await prismaClient.user.count({
			where: {
				role: "USER",
			},
		});

		const analytics = {
			outOfStockProducts: outOfStockCount,
			totalProducts: totalProducts,
			totalOrderProducts: totalOrderProducts || 0,
			totalUsers: totalUsers,
			outOfStockCountList: outOfStockCountList,
		};

		res.status(200).json({
			success: true,
			message: "Analytics data fetched successfully",
			data: analytics,
		});
	} catch (error) {
		console.error("Error fetching analytics data", error);
		res.status(500).json({ success: false, message: "Something went wrong" });
	}
};
