import * as jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";

const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
	const token = req.headers["authorization"];

	if (!token) return res.status(403).json({ message: "Login is required" });

	jwt.verify(token.split(" ")[1], process.env.JWT_SECRET!, (err, user: any) => {
		if (err) return res.status(403).json({ message: "Login is required" });
		next();
	});
};

export default authenticateToken;
