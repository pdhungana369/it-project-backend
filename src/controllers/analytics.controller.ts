import { Request, Response } from "express";
import { prismaClient } from "../server";

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const mostSoldProducts = await prismaClient.orderItem.groupBy({
      by: ["productId"],
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 5,
    });

    const mostSoldProductIds = mostSoldProducts
      .map((item) => item.productId)
      .filter((id): id is string => id !== null);

    const mostSoldProductsDetails = await prismaClient.product.findMany({
      where: {
        id: {
          in: mostSoldProductIds,
        },
      },
      select: {
        id: true,
        name: true,
        price: true,
        descriptions: true,
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    const mostSoldProductsWithDetails = mostSoldProducts.map((item) => ({
      productId: item.productId,
      quantity: item._sum.quantity,
      product: mostSoldProductsDetails.find((p) => p.id === item.productId),
    }));

    const topCartAddedProducts = await prismaClient.cartItem.groupBy({
      by: ["productId"],
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 5,
    });

    const topCartAddedProductIds = topCartAddedProducts
      .map((item) => item.productId)
      .filter((id): id is string => id !== null);

    const topCartAddedProductsDetails = await prismaClient.product.findMany({
      where: {
        id: {
          in: topCartAddedProductIds,
        },
      },
      select: {
        id: true,
        name: true,
        price: true,
        descriptions: true,
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    const topCartAddedProductsWithDetails = topCartAddedProducts.map(
      (item) => ({
        productId: item.productId,
        quantity: item._sum.quantity,
        product: topCartAddedProductsDetails.find(
          (p) => p.id === item.productId,
        ),
      }),
    );

    const completedOrders = await prismaClient.order.findMany({
      where: {
        status: "COMPLETED",
      },
      include: {
        OrderItem: {
          include: {
            product: {
              select: {
                price: true,
              },
            },
          },
        },
      },
    });

    const totalSales = completedOrders.reduce((acc, order) => {
      return (
        acc +
        order.OrderItem.reduce((orderAcc, item) => {
          const productPrice = item.product?.price ?? 0;
          return orderAcc + productPrice * item.quantity;
        }, 0)
      );
    }, 0);

    const totalIncomeGenerated = completedOrders.reduce((acc, order) => {
      return (
        acc +
        order.OrderItem.reduce((orderAcc, item) => {
          const productPrice = item.product?.price ?? 0;
          return orderAcc + productPrice * item.quantity;
        }, 0)
      );
    }, 0);

    const totalUsers = await prismaClient.user.count();
    const totalProducts = await prismaClient.product.count();
    const totalCategories = await prismaClient.category.count();

    const totalPaymentByMethodRaw = await prismaClient.payment.groupBy({
      by: ["id"],
      _sum: {
        amount: true,
      },
      where: {
        order: {
          status: "COMPLETED",
        },
      },
    });

    const totalPaymentByMethod = totalPaymentByMethodRaw.map((item) => ({
      amount: item._sum?.amount,
    }));

    const totalUsersAddedThisWeek = await prismaClient.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 7)),
        },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        mostSoldProducts: mostSoldProductsWithDetails,
        topCartAddedProducts: topCartAddedProductsWithDetails,
        totalSales,
        totalIncomeGenerated,
        totalUsers,
        totalPaymentByMethod,
        totalUsersAddedThisWeek,
        totalCategories,
        totalProducts,
      },
    });
  } catch (error) {
    console.error("Error fetching analytics data", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

export const getOrderHistory = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const completedOrders = await prismaClient.order.findMany({
      where: {
        status: "COMPLETED",
        createdAt: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string),
        },
      },
      select: {
        createdAt: true,
        OrderItem: {
          select: {
            product: {
              select: {
                price: true,
              },
            },
            quantity: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching order history", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};
