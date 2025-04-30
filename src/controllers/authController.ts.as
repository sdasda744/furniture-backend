import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import bcrypt from "bcrypt";
import moment from "moment";
import jwt from "jsonwebtoken";

class AuthError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = "AuthError";
  }
}

interface AuthRequest extends Request {
  body: {
    phone: string;
    password?: string;
    otp?: string;
    token?: string;
  };
}

interface UserData {
  phone: string;
  password?: string;
  randomToken?: string;
  errorLoginCount?: number;
  status?: string;
}

import {
  createOtp,
  createUser,
  getOtpByPhone,
  getUserByPhone,
  updateOtp,
  updateUser,
} from "../services/authServices";
import {
  checkExistingOtp,
  checkOtpErrorIfSameDate,
  checkUserExit,
  checkUserIfNotExit,
} from "../utils/auth";
import { generateOtp, generateToken } from "../utils/generate";

export const register = [
  body("phone", "Invalid Phone Number.")
    .trim()
    .notEmpty()
    .matches(/^[0-9]+$/)
    .isLength({ min: 5, max: 15 }),

  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({
      onlyFirstError: true,
    });
    if (errors.length > 0) {
      return next(new AuthError(errors[0].msg, 400, "Error_Invalid"));
    }

    // slice "09" if includes them
    let phone = req.body.phone;
    if (phone.startsWith("09")) {
      phone = phone.substring(2, phone.length);
    }

    const user = await getUserByPhone(phone);
    checkUserExit(user);

    // OTP sending logic here
    const otp = 123456; // otp testing
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otp.toString(), salt);
    const token = generateToken();

    const existingOtpRecord = await getOtpByPhone(phone);

    let result;
    if (!existingOtpRecord) {
      const otpData = {
        phone,
        otp: hashedOtp,
        rememberToken: token,
        count: 1,
      };
      result = await createOtp(otpData);
    } else {
      const lastRequestOtpDate = new Date(
        existingOtpRecord.updatedAt
      ).toLocaleDateString();
      const currentDate = new Date().toLocaleDateString();
      const isSameDate = lastRequestOtpDate === currentDate;
      checkOtpErrorIfSameDate(isSameDate, existingOtpRecord.error);

      if (!isSameDate) {
        const otpData = {
          otp: hashedOtp,
          rememberToken: token,
          count: { increment: 1 },
          error: 0,
        };
        result = await updateOtp(existingOtpRecord.id, otpData);
      } else {
        if (existingOtpRecord.count === 3) {
          return next(
            new AuthError(
              "OTP is allowed to request for 3 times per day.",
              405,
              "Error_OverLimit"
            )
          );
        } else {
          const otpData = {
            otp: hashedOtp,
            rememberToken: token,
            count: { increment: 1 },
          };
          result = await updateOtp(existingOtpRecord.id, otpData);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `OTP sent successfully to ${result.phone}`,
      phone: result.phone,
      token: result.rememberToken,
    });
  },
];

export const verifyOtp = [
  body("phone", "Invalid Phone Number.")
    .trim()
    .notEmpty()
    // .withMessage("Phone number is required.")
    .matches(/^[0-9]+$/)
    // .withMessage("Phone number must contain only digits.")
    .isLength({ min: 5, max: 15 }),
  // .withMessage("Phone number must be 5 to 15 digits long."),

  body("otp", "Invalid OTP")
    .trim()
    .notEmpty()
    .matches(/^[0-9]+$/)
    .isLength({ min: 6, max: 6 }),
  body("token", "Invalid Token").trim().notEmpty().escape(),

  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = new Error(errors[0].msg);
      error.status = 400;
      error.code = "Error_Invalid";
      return next(error);
    }

    const { phone, otp, token } = req.body;

    const user = await getUserByPhone(phone);
    checkUserExit(user);

    const existingOtpRecord = await getOtpByPhone(phone);
    checkExistingOtp(existingOtpRecord);

    const lastVerifyOtpDate = new Date(
      existingOtpRecord!.updatedAt
    ).toLocaleDateString();
    const currentDate = new Date().toLocaleDateString();
    const isSameDate = lastVerifyOtpDate === currentDate;
    // If OTP verify is in the same date and over limit.
    checkOtpErrorIfSameDate(isSameDate, existingOtpRecord!.error);

    // if otp is wrong, may be an attack
    if (existingOtpRecord?.rememberToken !== token) {
      const otpData = {
        error: 5,
      };
      await updateOtp(existingOtpRecord!.id, otpData);

      const error: any = new Error("Invalid Token error");
      error.status = 400;
      error.code = "Error_Invalid";
      return next(error);
    }

    // check opt expired
    const isExpired =
      moment().diff(existingOtpRecord!.updatedAt, "minutes") > 2;
    if (isExpired) {
      const error: any = new Error("OTP is expired");
      error.status = 403;
      error.code = "Error_otpExpired";
      return next(error);
    }

    // check otp error for day
    const isMatchOtp = bcrypt.compare(otp, existingOtpRecord!.otp);
    // if opt is wrong
    if (!isMatchOtp) {
      // if otp is wrong for next day
      if (!isSameDate) {
        const otpData = {
          error: 1,
        };
        await updateOtp(existingOtpRecord!.id, otpData);
      } else {
        // if otp is wrong for today
        const otpData = {
          error: { increment: 1 },
        };
        await updateOtp(existingOtpRecord!.id, otpData);
      }
      const error: any = new Error("OTP is incorrect");
      (error.status = 401), (error.code = "Error_Invalid");
      return next(error);
    }

    const verifyToken = generateToken();
    const otpData = {
      verifyToken,
      count: 1,
      error: 0,
    };

    const result = await updateOtp(existingOtpRecord!.id, otpData);

    res.status(200).json({
      success: true,
      message: "OTP is successfully verified",
      debug: {
        id: result.id,
        phone: result.phone,
        token: result.rememberToken,
        verifyToken: result.verifyToken,
      },
    });
  },
];

export const confirmPassword = [
  body("phone", "Invalid Phone Number.")
    .trim()
    .notEmpty()
    .matches(/^[0-9]+$/)
    .isLength({ min: 5, max: 15 }),

  body("password", "Password must be 8 digits")
    .trim()
    .notEmpty()
    .matches(/^[0-9]+$/)
    .isLength({ min: 8, max: 8 }),

  body("token", "Invalid Token").trim().notEmpty().escape(),

  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = new Error(errors[0].msg);
      error.status = 400;
      error.code = "Error_Invalid";
      return next(error);
    }

    const { phone, password, token } = req.body;
    const user = await getUserByPhone(phone);
    checkUserExit(user);

    const existingOtpRecord = await getOtpByPhone(phone);
    checkExistingOtp(existingOtpRecord);

    if (existingOtpRecord?.error === 5) {
      const error: any = new Error("This request may be attack.");
      error.status = 400;
      error.code = "Error_Attack";
      return next(error);
    }

    // This is also untrusted
    if (existingOtpRecord?.verifyToken !== token) {
      const otpData = {
        error: 5,
      };
      await updateOtp(existingOtpRecord!.id, otpData);

      const error: any = new Error("Invalid Token");
      error.status = 400;
      error.code = "Error_Invalid";
      return next(error);
    }

    const isExpired =
      moment().diff(existingOtpRecord?.updatedAt, "minutes") >= 10;
    if (isExpired) {
      const error: any = new Error(
        "Your request is expired. Please try again!"
      );
      error.status = 403;
      error.code = "Error_RequestExpired";
      return next(error);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const randomToken = "I will replace it soon";

    const userData = {
      phone,
      password: hashedPassword,
      randomToken,
    };

    const newUser = await createUser(userData);

    const accessTokenPayload = { id: newUser.id };
    const refreshTokenPayload = { id: newUser.id, phone: newUser.phone };

    const accessToken = jwt.sign(
      accessTokenPayload,
      process.env.ACCESS_TOKEN_SECRET!,
      {
        expiresIn: 15 * 60,
      }
    );

    const refreshToken = jwt.sign(
      refreshTokenPayload,
      process.env.REFRESH_TOKEN_SECRET!,
      {
        expiresIn: "30d",
      }
    );

    const userUpdateData = {
      randomToken: refreshToken,
    };

    await updateUser(newUser.id, userUpdateData);

    res
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 15 * 60 * 100, // 15 mins
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 30 * 24 * 60 * 60 * 100, // 3o days
      })
      .status(200)
      .json({
        success: true,
        message: "User account is created successfully",
        id: newUser.id,
        phone: newUser.phone,
      });
  },
];

export const login = [
  body("phone", "Invalid Phone Number.")
    .trim()
    .notEmpty()
    .matches(/^[0-9]+$/)
    .isLength({ min: 5, max: 15 }),

  body("password", "Password must be 8 digits")
    .trim()
    .notEmpty()
    .matches(/^[0-9]+$/)
    .isLength({ min: 8, max: 8 }),

  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = new Error(errors[0].msg);
      (error.status = 400), (error.code = "Error_Invalid");
      return next(error);
    }

    let phone = req.body.phone;
    if (phone.startsWith("09")) {
      phone.substring(2, phone.length);
    }

    const password = req.body.password;

    const user = await getUserByPhone(phone);
    checkUserIfNotExit(user);

    if (user!.status === "Freeze") {
      const error: any = new Error(
        "Your account is temporally freeze, please contact us."
      );
      error.status = 401;
      error.code = "Error_AccountFreeze";
      return next(error);
    }

    const isMatchPassword = await bcrypt.compare(password, user!.password);

    if (!isMatchPassword) {
      const lastRequest = new Date(user!.updatedAt).toLocaleDateString();
      const isSameDate = lastRequest === new Date().toLocaleDateString();

      if (!isSameDate) {
        const userData = {
          errorLoginCount: 1,
        };
        await updateUser(user!.id, userData);
      } else {
        if (user!.errorLoginCount >= 2) {
          const userData = {
            status: "Freeze",
          };
          await updateUser(user!.id, userData);
        } else {
          const userData = {
            errorLoginCount: { increment: 1 },
          };
          await updateUser(user!.id, userData);
        }
      }
      const error: any = new Error("Wrong Password");
      error.status = 401;
      error.code = "Error_Invalid";
      return next(error);
    }

    const accessTokenPayload = { id: user!.id };
    const refreshTokenPayload = { id: user!.id, phone: user!.phone };

    const accessToken = jwt.sign(
      accessTokenPayload,
      process.env.ACCESS_TOKEN_SECRET!,
      {
        expiresIn: 15 * 60,
      }
    );

    const refreshToken = jwt.sign(
      refreshTokenPayload,
      process.env.REFRESH_TOKEN_SECRET!,
      {
        expiresIn: "30d",
      }
    );

    const userData = {
      errorLoginCount: 0,
      randomToken: refreshToken,
    };
    await updateUser(user!.id, userData);

    res
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 15 * 60 * 100, // 15 mins
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 30 * 24 * 60 * 60 * 100, // 3o days
      })
      .status(200)
      .json({
        success: true,
        message: "login",
        id: user!.id,
        phone: user!.phone,
      });
  },
];
