import { Response, NextFunction } from "express";
import { CustomRequest } from "../types";
import { getUserById } from "../services/authServices";
import { Errors } from "../utils/createErrors";

export const authorize = (permission: boolean, ...roles: string[]) => {
  return async (req: CustomRequest, res: Response, next: NextFunction) => {
    const userId = req.userId;
    const user = await getUserById(userId!);
    if (!user) {
      return next(Errors.notRegistered());
    }

    const result = roles.includes(user.role); // authorize(true, "ADMIN")

    if (permission && !result) {
      return next(Errors.unauthorized());
    }

    if (!permission && result) {
      return next(Errors.unauthorized());
    }

    req.user = user;

    next();
  };
};
