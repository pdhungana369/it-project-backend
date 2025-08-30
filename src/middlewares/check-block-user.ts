import type { NextFunction, Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { verifyToken } from "../utils/jwthandler";
import { prismaClient } from "../server";

export const checkBlockUser = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const token = req.headers.authorization!;

		const tokenWithoutBearer: string = token.split(" ")[1];
		const userTokenDetails = verifyToken(tokenWithoutBearer) as JwtPayload;

		const userDetails = await prismaClient.user.findUnique({
			where: {
				id: userTokenDetails?.id,
			},
		});
		if (userDetails?.isBlocked) {
			return res.status(404).json({
				success: false,
				error: "User is blocked. Please contact to admin to unblock",
			});
		} else {
			next();
		}
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: "Something went wrong",
		});
	}
};
