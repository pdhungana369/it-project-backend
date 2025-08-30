import * as jwt from "jsonwebtoken";

export const generateToken = (payload: object) => {
	return jwt.sign(payload, process.env.JWT_SECRET as string, {
		expiresIn: "100 days",
	});
};

export const verifyToken = (token: string) => {
	return jwt.verify(token, process.env.JWT_SECRET as string);
};
