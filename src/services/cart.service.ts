import { prismaClient } from "../server";
import { ICart, IProduct } from "../types";

export class CartService {
	public static async findAll() {
		const cart = await prismaClient.cart.findMany({
			// include: {
			// 	product: {
			// 		select: {
			// 			id: true,
			// 			name: true,
			// 			price: true,
			// 		},
			// 	},
			// 	user: {
			// 		select: {
			// 			id: true,
			// 			name: true,
			// 			email: true,
			// 		},
			// 	},
			// },
		});
		return cart;
	}
	// public static async userCartFindAll(id: string) {
	// 	const cart = await prismaClient..findMany({
	// 		where: {
	// 			userId: id,
	// 		},
	// 	});
	// 	return cart;
	// }

	public static async findOneProduct(id: string) {
		const product = await prismaClient.product.findFirst({
			where: {
				id,
			},
		});
		return product;
	}

	public static async create(data: ICart) {
		const cart = await prismaClient.cart.create({
			data,
		});
		return cart;
	}

	public static async update(id: string, data: ICart) {
		const cart = await prismaClient.cart.update({
			where: {
				id: id,
			},
			data,
		});
		return cart;
	}

	public static async delete(id: string) {
		const cart = await prismaClient.cart.delete({
			where: {
				id,
			},
		});
		return cart;
	}
}
