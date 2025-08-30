import { prismaClient } from "../server";
import { IUser } from "../types";

export class UserService {
  public static async findOne(email: string) {
    const user = await prismaClient.user.findUnique({
      where: {
        email,
      },
    });
    return user;
  }
  public static async findOneById(id: string) {
    const user = await prismaClient.user.findUnique({
      where: {
        id: id,
      },
    });
    return user;
  }

  public static async create(data: IUser) {
    const user = await prismaClient.user.create({ data });
    return user;
  }

  public static async findAll() {
    const user = await prismaClient.user.findMany({
      where: {
        role: "USER",
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        createdAt: true,
        email: true,
        name: true,
        phoneNumber: true,
      },
    });
    return user;
  }
}
