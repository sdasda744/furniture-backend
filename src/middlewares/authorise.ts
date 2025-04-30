import { Response, NextFunction } from "express";
import { CustomRequest } from "../types";
import { getUserByID } from "../services/authServices";
import { Errors } from "../utils/createErrors";

export const authorize = (permission: boolean, ...roles: string[]) => {
  return async (req: CustomRequest, res: Response, next: NextFunction) => {
    const userId = req.userId;
    const user = await getUserByID(userId!);
    if (!user) {
      return next(Errors.notRegistered());
    }

    const result = roles.includes(user.role);

    if (permission && !result) {
      return next(Errors.checkAuthorize());
    }

    if (!permission && result) {
      return next(Errors.checkAuthorize());
    }

    req.user = user;

    next();
  };
};
