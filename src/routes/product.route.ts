import { Router } from "express";
import {
	createProduct,
	deleteProduct,
	getAllProduct,
	updateProduct,
	getCategoryWithProductParams,
	getAllProductByUser,
	getProductByUser,
	getProductById,
} from "../controllers/product.controller";
import adminMiddleware from "../middlewares/authorize-role";
import authenticateToken from "../middlewares/authenticate-token";

const productRoutes: Router = Router();

productRoutes.get("/product", getAllProduct);
productRoutes.get("/product/:id", getProductById);
productRoutes.get("/product/user", authenticateToken, getAllProductByUser);
productRoutes.post("/product", authenticateToken, createProduct);
productRoutes.delete("/product/:id", authenticateToken, deleteProduct);
productRoutes.get("/product/:id", adminMiddleware, getProductByUser);
productRoutes.patch("/product/:id", authenticateToken, updateProduct);
productRoutes.get("/product-with-category", getCategoryWithProductParams);

export default productRoutes;
