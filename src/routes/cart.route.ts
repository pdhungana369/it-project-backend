import { Router } from "express";

import authenticateToken from "../middlewares/authenticate-token";
import adminMiddleware from "../middlewares/authorize-role";
import {
	getAllCartItems,
	createCart,
	getAllCartByUser,
	deleteCart,
	updateCart,
} from "../controllers/cart.controller";

const cartRoutes: Router = Router();

cartRoutes.get("/admin/cart", adminMiddleware, getAllCartItems);
cartRoutes.get("/cart", authenticateToken, getAllCartByUser);
cartRoutes.post("/cart", authenticateToken, createCart);
cartRoutes.delete("/cart/:cartItemId", authenticateToken, deleteCart);
cartRoutes.patch("/cart", authenticateToken, updateCart);
// cartRoutes.delete("/product/:id", adminMiddleware, deleteProduct);
// cartRoutes.patch("/product/:id", adminMiddleware, updateProduct);

export default cartRoutes;
