import { Router } from "express";
import {
  create,
  deleteCategory,
  getAllCategory,
  getWithProduct,
  updateCategory,
  getCategoryWithProductParams,
} from "../controllers/category.controller";
import adminMiddleware from "../middlewares/authorize-role";

const categoryRoutes: Router = Router();

categoryRoutes.get("/category", getAllCategory);
categoryRoutes.post("/category", adminMiddleware, create);
categoryRoutes.get("/category/product/:id", adminMiddleware, getWithProduct);
categoryRoutes.patch("/category/:id", adminMiddleware, updateCategory);
categoryRoutes.delete("/category/:id", adminMiddleware, deleteCategory);
categoryRoutes.get("/category-with-product", getCategoryWithProductParams);

export default categoryRoutes;
