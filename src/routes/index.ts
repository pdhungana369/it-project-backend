import { Router } from "express";
import userRoute from "./user.route";
import analytics from "./analytics.route";
import productRoutes from "./product.route";
import categoryRoutes from "./category.route";
import cartRoutes from "./cart.route";

const rootRouter: Router = Router();

rootRouter.use("/", userRoute);
rootRouter.use("/", productRoutes);
rootRouter.use("/", productRoutes);
rootRouter.use("/", analytics);
rootRouter.use("/", categoryRoutes);
rootRouter.use("/", cartRoutes);

export default rootRouter;
