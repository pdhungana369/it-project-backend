import { prismaClient } from "../server";

export class ProductService {
  public static async findAll() {
    const product = await prismaClient.product.findMany({
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    return product;
  }
  public static async findAllProductUser() {
    const product = await prismaClient.product.findMany({
      select: {
        id: true,
        price: true,
        createdAt: true,
        updatedAt: true,
        descriptions: true,
        name: true,
        outOfStock: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    return product;
  }
}
