import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { Errors } from "../utils/createErrors";
import { getUserByID, updateUser } from "../services/authServices";
import { CustomRequest } from "../types";

// interface CustomRequest extends Request {
//   userId?: number;
// }

export const auth = (req: CustomRequest, res: Response, next: NextFunction) => {
  const accessToken = req.cookies ? req.cookies.accessToken : null;
  const refreshToken = req.cookies ? req.cookies.refreshToken : null;

  if (!refreshToken) {
    // const error: any = new Error("You are not authenticated user");
    // error.status = 401;
    // error.code = "Error_Unauthenticated";
    // return next(error);
    const error = Errors.unauthenticated();
    return next(new Error(error.message));
  }

  const generateNewToken = async () => {
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as {
        id: number;
        phone: string;
      };
    } catch (err) {
      const error = Errors.unauthenticated();
      return next(new Error(error.message));
    }

    if (isNaN(decoded.id)) {
      const error = Errors.unauthenticated();
      return next(new Error(error.message));
    }

    const user = await getUserByID(decoded.id);
    if (!user) {
      const error = Errors.unauthenticated();
      return next(new Error(error.message));
    }

    if (user.phone !== decoded.phone) {
      const error = Errors.unauthenticated();
      return next(new Error(error.message));
    }

    if (user.randomToken !== refreshToken) {
      const error = Errors.unauthenticated();
      return next(new Error(error.message));
    }

    const accessTokenPayload = { id: user.id };
    const refreshTokenPayload = { id: user.id, phone: user.phone };

    const newAccessToken = jwt.sign(
      accessTokenPayload,
      process.env.ACCESS_TOKEN_SECRET!,
      {
        expiresIn: 2 * 60,
      }
    );

    const newRefreshToken = jwt.sign(
      refreshTokenPayload,
      process.env.REFRESH_TOKEN_SECRET!,
      {
        expiresIn: 15 * 60,
      }
    );

    const userData = {
      randomToken: newRefreshToken,
    };
    await updateUser(user.id, userData);

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    req.userId = user.id;
    next();
  };

  if (!accessToken) {
    generateNewToken();
    // const error: any = new Error("Access token is expired.");
    // error.status = 401;
    // error.code = "Error_AccessTokenExpired";
    // return next(error);
    // return next(Errors.accessTokenExpired());
  } else {
    let decoded;

    try {
      decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET!) as {
        id: number;
      };

      if (isNaN(decoded.id)) {
        // return next(Errors.unauthenticatedUser());
        const error = Errors.unauthenticated();
        return next(new Error(error.message));
      }

      req.userId = decoded.id;
      next();
    } catch (error: any) {
      if ((error.name = "TokenExpiredError")) {
        generateNewToken();
      } else {
        const error = Errors.unauthenticated();
        return next(new Error(error.message));
      }
    }
  }
};
