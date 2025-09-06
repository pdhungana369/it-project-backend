import { Router } from "express";
import {
	createOrder,
	updateOrderStatus,
	getAllOrderAdmin,
	getOrderById,
	getOrderDetails,
} from "../controllers/order.controller";

const orderRoute = Router();

orderRoute.post("/order", createOrder);
orderRoute.patch("/admin/order-change-status", updateOrderStatus);
orderRoute.get("/admin/orders", getAllOrderAdmin);
orderRoute.get("/admin/order/:id", getOrderById);
orderRoute.get("/order-details", getOrderDetails);

export default orderRoute;
