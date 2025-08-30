import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
	const token = req.headers["authorization"];

	if (!token) {
		return res
			.status(403)
			.json({ message: "Access denied. No token provided." });
	}

	const tokenWithoutBearer = token.split(" ")[1];

	jwt.verify(
		tokenWithoutBearer,
		process.env.JWT_SECRET!,
		(err: any, user: any) => {
			if (err) {
				return res.status(403).json({ message: "Invalid token." });
			}
			if (user.role !== "ADMIN") {
				return res.status(403).json({ message: "Access denied. Admins only." });
			}
			next();
		}
	);
};

export default adminMiddleware;
