import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { generateToken } from "../utils/jwthandler";
import { checkUserId } from "../utils/check-userid";
import { prismaClient } from "../server";

export const register = async (req: Request, res: Response) => {
	const { name, email, password, phoneNumber } = req?.body;
	try {
		const userExits = await UserService.findOne(email);
		if (userExits) {
			return res
				.status(400)
				.json({ status: "failure", error: `${email} already exits.` });
		}
		const hashedPassword = await bcrypt.hash(password, 10);
		const data = await UserService.create({
			name,
			email,
			password: hashedPassword,
			role: "USER",
			phoneNumber: String(phoneNumber),
		});
		res.status(201).json({ status: "success", data: data });
	} catch (error) {
		res
			.status(400)
			.json({ status: "failure", message: `something went wrong` });
	}
};
export const adminGetAllusers = async (req: Request, res: Response) => {
	try {
		const data = await prismaClient.user.findMany({
			where: {
				role: "USER",
			},
		});
		res.status(200).json({ status: "success", data: data });
	} catch (error) {
		res
			.status(400)
			.json({ status: "failure", message: `something went wrong` });
	}
};
export const adminRegister = async (req: Request, res: Response) => {
	const { name, email, password } = req?.body;

	try {
		const userExits = await UserService.findOne(email);
		if (userExits) {
			return res
				.status(400)
				.json({ status: "failure", error: `${email} already exits.` });
		}
		const hashedPassword = await bcrypt.hash(password, 10);
		const data = await UserService.create({
			name,
			email,
			password: hashedPassword,
			role: "ADMIN",
		});
		res.status(201).json({ status: "success", data: data });
	} catch (error) {
		res
			.status(400)
			.json({ status: "failure", message: `something went wrong` });
	}
};

export const userLogin = async (req: Request, res: Response) => {
	const { email, password } = req?.body;

	try {
		const user: any = await UserService.findOne(email);
		if (!user?.email) {
			return res
				.status(400)
				.json({ status: "failure", error: `Invalid Credentials` });
		}
		if (user?.role !== "USER") {
			return res.status(400).json({
				success: false,
				error: "Invalid Credentials",
			});
		}

		const isMatch = await bcrypt.compare(password, user.password!);

		if (!isMatch) {
			return res
				.status(400)
				.json({ status: "failure", error: `Invalid Credentials` });
		}

		const token = generateToken({
			id: user?.id,
			email: user?.email,
			role: "USER",
		});

		return res?.status(200).json({
			status: "success",
			data: {
				userInfo: {
					email,
					role: "USER",
					id: user?.id,
					name: user.name,
					userId: user?.id,
				},
				token,
			},
		});
	} catch (error) {
		console.log(error);
		res.status(400).json({ status: "failure", error: `something went wrong` });
	}
};

export const adminLogin = async (req: Request, res: Response) => {
	const { email, password } = req?.body;
	try {
		const user: any = await UserService.findOne(email);
		if (user?.role !== "ADMIN") {
			return res.status(400).json({
				success: false,
				error: "Invalid Credentials",
			});
		}
		if (!user?.email) {
			return res
				.status(400)
				.json({ status: "failure", error: `Invalid Credentials` });
		}
		const isMatch = await bcrypt.compare(password, user.password!);
		if (!isMatch) {
			return res.status(400).json({
				success: false,
				error: "Invalid Credentials",
			});
		}
		const token = generateToken({
			id: user?.id,
			email: user?.email,
			role: "ADMIN",
		});
		return res?.status(200).json({
			success: true,
			data: {
				adminInfo: {
					email,
					role: "ADMIN",
					id: user?.id,
					name: user.name,
				},
				token,
			},
		});
	} catch (error) {
		res.status(400).json({
			success: false,
			error: "Something went wrong",
		});
	}
};

export const getMe = async (req: Request, res: Response) => {
	try {
		const token = req.headers["authorization"];
		const userId = checkUserId(token as string);
		const isUserExits = await UserService.findOneById(userId);
		if (!isUserExits) {
			return res.status(400).json({ success: false, error: "User not found" });
		}

		const user = await prismaClient.user.findFirst({
			where: { id: userId },
			select: {
				id: true,
				email: true,
				phoneNumber: true,
				name: true,
			},
		});

		// const bookings = await prismaClient.booking.findMany({
		//   where: { userId: userId },
		//   select: {
		//     id: true,
		//     dateAndTime: true,
		//     createdAt: true,
		//     updatedAt: true,
		//     services: true,
		//     Review: true,
		//   },
		// });
		// console.log("booking list", bookings);
		//
		const usersData = {
			...user,
		};

		return res.status(200).json({
			success: true,
			data: usersData,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Something went wrong",
		});
	}
};
