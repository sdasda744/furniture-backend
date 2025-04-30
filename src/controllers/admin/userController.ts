import { Request, Response, NextFunction } from "express";
import { CustomRequest } from "../../types";

// interface CustomRequest extends Request {
//   user?: any;
// }

export const getAllUsers = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;
  res.status(200).json({ message: req.t("welcome"), currentUserRole: user.role });
};
