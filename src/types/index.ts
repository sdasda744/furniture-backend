import { Request } from "express";

export interface CustomRequest extends Request {
  userId?: number;
  user?: any;
}

export type Otp = {
  id: number;
  phone: string;
  otp: string;
  rememberToken: string;
  verifyToken: string | null;
  count: number;
  error: number;
  createdAt: Date;
  updatedAt: Date;
};
