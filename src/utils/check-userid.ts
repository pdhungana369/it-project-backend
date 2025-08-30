import { JwtPayload } from "jsonwebtoken";
import { verifyToken } from "./jwthandler";

export const checkUserId = (token: string) => {
  if (!token) {
    throw new Error("Authentication token is missing");
  }
  const tokenWithoutBearer: string = token.split(" ")[1];
  try {
    const userTokenDetails = verifyToken(tokenWithoutBearer) as JwtPayload;

    if (!userTokenDetails?.id) {
      throw new Error("Authentication token is missing");
    }
    return userTokenDetails.id;
  } catch (error) {
    throw new Error("Invalid token");
  }
};
