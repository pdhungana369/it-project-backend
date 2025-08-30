import { Router } from "express";
import authenticateToken from "../middlewares/authenticate-token";
import adminMiddleware from "../middlewares/authorize-role";
import { getAnalytics } from "../controllers/analytics.controller";

const userRoute = Router();

userRoute.get(
  "/admin/analytics",
  authenticateToken,
  adminMiddleware,
  getAnalytics,
);

export default userRoute;
