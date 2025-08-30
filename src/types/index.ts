type IRole = "ADMIN" | "USER";

export interface ICategory {
  id?: string;
  name: string;
  description?: string;
}

export interface IProduct {
  id?: string;
  name: string;
  code: string;
  categoryId: string;
  imageUrl: string;
  descriptions: string;
  outOfStock?: boolean;
  buyingPrice: number;
  price: number;
}

export interface IUser {
  id?: string;
  name: string;
  email: string;
  password: string;
  role?: IRole;
  phoneNumber?: string;
}
export interface ICart {
  id?: string;
  userId?: string;
  cartItems?: ICartItem[];
  totalPrice: number;
}

export interface ICartItem {
  id?: string;
  productId: string;
  quantity: number;
}
