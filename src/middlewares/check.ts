import { Request, Response, NextFunction } from "express";

interface CustomRequest extends Request {
  userId?: number;
}

export const check = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  // const error: any = new Error("token has expired");
  // error.status = 401;
  // error.code = "error_tokenExpired"
  // return next(error)
  req.userId = 12345;
  next();
};
