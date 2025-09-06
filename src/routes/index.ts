import { Router } from "express";
import userRoute from "./user.route";
import analyticsRoute from "./analytics.route";
import productRoute from "./product.route";
import categoryRoute from "./category.route";
import cartRoute from "./cart.route";
import orderRoute from "./order.route";
const rootRouter: Router = Router();

rootRouter.use("/", userRoute);
rootRouter.use("/", productRoute);
rootRouter.use("/", orderRoute);
rootRouter.use("/", analyticsRoute);
rootRouter.use("/", categoryRoute);
rootRouter.use("/", cartRoute);

export default rootRouter;
