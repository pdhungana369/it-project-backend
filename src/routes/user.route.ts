import { Router } from "express";
import authenticateToken from "../middlewares/authenticate-token";
import {
  adminRegister,
  adminGetAllusers,
  adminLogin,
  getMe,
  register,
  userLogin,
} from "../controllers/user.controller";

const userRoute = Router();

userRoute.post("/admin/register", adminRegister);
userRoute.get("/admin/users", adminGetAllusers);
userRoute.post("/admin/register", adminRegister);
userRoute.post("/register", register);
userRoute.post("/login", userLogin);
userRoute.post("/admin/login", adminLogin);

userRoute.get("/me", authenticateToken, getMe);

export default userRoute;
