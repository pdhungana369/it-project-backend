import { prismaClient } from "../server";
import { ICategory } from "../types";

export class CategoryService {
  public static async findOne(name: string) {
    const category = await prismaClient.category.findUnique({
      where: {
        name,
      },
    });
    return category;
  }

  public static async findAll() {
    const category = await prismaClient.category.findMany({
      include: {
        product: {
          select: {
            name: true,
            descriptions: true,
          },
        },
      },
    });
    return category;
  }

  public static async create(data: ICategory) {
    const category = await prismaClient.category.create({
      data,
    });
    return category;
  }

  public static async update(id: string, data: ICategory) {
    const category = await prismaClient.category.update({
      where: {
        id: id,
      },
      data,
    });
    return category;
  }

  public static async delete(id: string) {
    const category = await prismaClient.category.delete({
      where: {
        id,
      },
    });
    return category;
  }
  public static async findWithProduct(id: string) {
    const category = await prismaClient.category.findUnique({
      where: {
        id,
      },
      select: {
        name: true,
        id: true,
        product: true,
      },
    });
    return category;
  }
}
