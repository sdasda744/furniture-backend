import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import bcrypt from "bcrypt";
import moment from "moment";
import jwt from "jsonwebtoken";

import {
  createOtp,
  createUser,
  getOtpByPhone,
  getUserByID,
  getUserByPhone,
  updateOtp,
  updateOtpByPhone,
  updateUser,
} from "../services/authServices";
import {
  checkExistingOtp,
  checkOtpErrorIfSameDate,
  checkUserExit,
  checkUserIfNotExit,
} from "../utils/auth";
import { generateOtp, generateToken } from "../utils/generate";
import { Errors } from "../utils/createErrors";

// register new user
export const register = [
  body("phone", "Invalid Phone Number.")
    .trim()
    .notEmpty()
    // .withMessage("Phone number is required.")
    .matches(/^[0-9]+$/)
    // .withMessage("Phone number must contain only digits.")
    .isLength({ min: 5, max: 15 }),
  // .withMessage("Phone number must be 5 to 15 digits long."),

  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({
      onlyFirstError: true,
    });
    if (errors.length > 0) {
      const error: any = new Error(errors[0].msg);
      error.status = 400;
      error.code = "Error_Invalid";
      return next(error);
    }

    // slice "09" if includes them
    let phone = req.body.phone;
    if (phone.startsWith("09")) {
      phone = phone.substring(2, phone.length);
    }

    console.log(phone);

    const user = await getUserByPhone(phone);
    checkUserExit(user);

    // OTP sending logic here
    // Generate otp && call otp sending api
    // save otp to db
    // hash otp
    const otp = 123456; // otp testing
    // const otp = generateOtp();
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otp.toString(), salt);
    const token = generateToken();

    const existingOtpRecord = await getOtpByPhone(phone);

    let result;
    // if user never request otp before
    if (!existingOtpRecord) {
      // create otp data
      const otpData = {
        phone,
        otp: hashedOtp,
        rememberToken: token,
        count: 1,
      };
      // adding otp data to db
      result = await createOtp(otpData);
    } else {
      const lastRequestOtpDate = new Date(
        existingOtpRecord.updatedAt
      ).toLocaleDateString();
      const currentDate = new Date().toLocaleDateString();
      const isSameDate = lastRequestOtpDate === currentDate;
      checkOtpErrorIfSameDate(isSameDate, existingOtpRecord.error);

      // If OTP request is not in the same date
      if (!isSameDate) {
        const otpData = {
          otp: hashedOtp,
          rememberToken: token,
          count: { increment: 1 },
          error: 0,
        };
        result = await updateOtp(existingOtpRecord.id, otpData);
      } else {
        // if OTP request is in the same date and over limit
        if (existingOtpRecord.count === 3) {
          // const error: any = new Error(
          //   "OTP is allowed to request for 3 times per day."
          // );
          // error.status = 405;
          // error.code = "Error_OverLimit";
          // return next(error);
          return next(Errors.otpRequestLimit());
        } else {
          // if OTP request is in the same date and not over limit
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
      token: result.rememberToken,
    });
  },
];

// verify otp
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

      // const error: any = new Error("Invalid Token error");
      // error.status = 400;
      // error.code = "Error_Invalid";
      // return next(error);
      return next(Errors.InvalidToken());
    }

    // check opt expired
    const isExpired =
      moment().diff(existingOtpRecord!.updatedAt, "minutes") > 2;
    if (isExpired) {
      // const error: any = new Error("OTP is expired");
      // error.status = 403;
      // error.code = "Error_otpExpired";
      // return next(error);
      return next(Errors.otpExpired());
    }

    // check otp error for day
    const isMatchOtp = await bcrypt.compare(otp, existingOtpRecord!.otp);
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
      // const error: any = new Error("OTP is incorrect");
      // (error.status = 401), (error.code = "Error_Invalid");
      // return next(error);
      return next(Errors.otpIncorrect());
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

      id: result.id,
      phone: result.phone,
      token: result.rememberToken,
      verifyToken: result.verifyToken,
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
      // const error: any = new Error("This request may be attack.");
      // error.status = 400;
      // error.code = "Error_Attack";
      // return next(error);
      return next(Errors.requestAttack());
    }

    // This is also untrusted
    if (existingOtpRecord?.verifyToken !== token) {
      const otpData = {
        error: 5,
      };
      await updateOtp(existingOtpRecord!.id, otpData);

      // const error: any = new Error("Invalid Token");
      // error.status = 400;
      // error.code = "Error_Invalid";
      // return next(error);
      return next(Errors.InvalidToken());
    }

    const isExpired =
      moment().diff(existingOtpRecord?.updatedAt, "minutes") >= 10;
    if (isExpired) {
      // const error: any = new Error(
      //   "Your request is expired. Please try again!"
      // );
      // error.status = 403;
      // error.code = "Error_RequestExpired";
      // return next(error);
      return next(Errors.requestExpired());
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const fakeRandomToken = generateToken();

    const userData = {
      phone,
      password: hashedPassword,
      randomToken: fakeRandomToken,
    };

    const newUser = await createUser(userData);

    const accessTokenPayload = { id: newUser.id };
    const refreshTokenPayload = { id: newUser.id, phone: newUser.phone };

    const accessToken = jwt.sign(
      accessTokenPayload,
      process.env.ACCESS_TOKEN_SECRET!,
      {
        expiresIn: 2 * 60,
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
        maxAge: 15 * 60 * 1000, // 15 mins
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
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
      phone = phone.substring(2); // or phone = phone.slice(2);
    }

    const password = req.body.password;

    const user = await getUserByPhone(phone);
    checkUserIfNotExit(user);

    if (user!.status === "FREEZE") {
      // const error: any = new Error(
      //   "Your account is temporally freeze, please contact us."
      // );
      // error.status = 401;
      // error.code = "Error_AccountFreeze";
      // return next(error);
      return next(Errors.freezeError());
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
      // const error: any = new Error("Wrong Password");
      // error.status = 401;
      // error.code = "Error_Invalid";
      // return next(error);
      return next(Errors.wrongPassword(req));
    }

    const accessTokenPayload = { id: user!.id };
    const refreshTokenPayload = { id: user!.id, phone: user!.phone };

    const accessToken = jwt.sign(
      accessTokenPayload,
      process.env.ACCESS_TOKEN_SECRET!,
      {
        expiresIn: 2 * 60,
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
        maxAge: 15 * 60 * 1000, // 15 mins
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
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

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const refreshToken = req.cookies ? req.cookies.refreshToken : null;

  if (!refreshToken) {
    return next(Errors.unauthenticated());
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as {
      id: number;
      phone: string;
    };
  } catch (err) {
    return next(Errors.unauthenticated());
  }

  if (isNaN(decoded.id)) {
    return next(Errors.unauthenticated());
  }

  const user = await getUserByID(decoded.id);
  checkUserIfNotExit(user);

  if (user!.phone !== decoded.phone) {
    return next(Errors.unauthenticated());
  }

  const userData = {
    randomToken: generateToken(),
  };
  await updateUser(user!.id, userData);

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.status(200).json({
    success: true,
    message: "successfully logout.",
  });
};

// forgot password
export const forgotPassword = [
  body("phone", "Invalid Phone Number.")
    .trim()
    .notEmpty()
    .matches(/^[0-9]+$/)
    .isLength({ min: 5, max: 15 }),

  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = new Error(errors[0].msg);
      (error.status = 400), (error.code = "Error_Invalid");
      return next(error);
    }

    let phone = req.body.phone;

    if (phone.startsWith("09")) {
      phone = phone.substring(2);
    }

    const existingOtpRecord = await getOtpByPhone(phone);
    checkExistingOtp(existingOtpRecord);

    if (!existingOtpRecord?.verifyToken) {
      return next(Errors.notVerifyPhone());
    }

    if (existingOtpRecord?.error === 5) {
      return next(Errors.unauthenticated());
    }

    const user = await getUserByPhone(phone);
    checkUserIfNotExit(user);

    const userData = {
      randomToken: generateToken(),
    };

    await updateUser(user!.id, userData);

    if (user?.status === "FREEZE") {
      return next(Errors.unauthenticated());
    }

    if (!user?.randomToken) {
      return next(Errors.unauthenticated());
    }

    // hash otp
    const otp = 778899; // new otp testing
    // const otp = generateOtp();
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otp.toString(), salt);
    const token = generateToken();

    let result;

    const lastRequestOtpDate = new Date(
      existingOtpRecord.updatedAt
    ).toLocaleDateString();
    const currentDate = new Date().toLocaleDateString();
    const isSameDate = lastRequestOtpDate === currentDate;
    checkOtpErrorIfSameDate(isSameDate, existingOtpRecord.error);

    if (!isSameDate) {
      // create otp data
      const otpData = {
        otp: hashedOtp,
        rememberToken: token,
        count: { increment: 1 },
      };
      // adding otp data to db
      result = await updateOtp(existingOtpRecord.id, otpData);
    } else {
      if (existingOtpRecord.count === 4) {
        return next(Errors.otpRequestLimit());
      } else {
        // re-request opt for reset password
        if (existingOtpRecord.count !== 4) {
          // create otp data
          const otpData = {
            otp: hashedOtp,
            rememberToken: token,
            count: { increment: 1 },
          };
          // adding otp data to db
          result = await updateOtp(existingOtpRecord.id, otpData);
        }
      }
    }

    res.status(200).json({
      success: true,
      otpID: result!.id,
      message: `OTP sent successfully to ${result!.phone}`,
      token: result!.rememberToken,
      count: result?.count,
    });
  },
];

export const verifyOtpForResetPassword = [
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
      (error.status = 400), (error.code = "Error_Invalid");
      return next(error);
    }

    const { phone, otp, token } = req.body;

    const existingOtpRecord = await getOtpByPhone(phone);
    checkExistingOtp(existingOtpRecord);

    if (!existingOtpRecord?.verifyToken) {
      return next(Errors.notVerifyPhone());
    }

    if (existingOtpRecord?.error === 5) {
      return next(Errors.unauthenticated());
    }

    const user = await getUserByPhone(phone);
    checkUserIfNotExit(user);

    if (user?.status === "FREEZE") {
      return next(Errors.unauthenticated());
    }

    if (!user?.randomToken) {
      return next(Errors.unauthenticated());
    }

    // if (existingOtpRecord.phone !== phone) {
    //   return next(Errors.InvalidToken())
    // }

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
      await updateOtp(existingOtpRecord.id, otpData);
      return next(Errors.InvalidToken());
    }

    // check opt expired
    const isExpired =
      moment().diff(existingOtpRecord!.updatedAt, "minutes") > 2;
    if (isExpired) {
      return next(Errors.otpExpired());
    }

    // check otp error for day
    const isMatchOtp = await bcrypt.compare(otp, existingOtpRecord!.otp);
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
      return next(Errors.otpIncorrect());
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
      otpID: result.id,
      token: result.rememberToken,
      verifyToken: result.verifyToken,
    });
  },
];

// reset password
export const resetPassword = [
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
    // checkUserExit(user);

    const existingOtpRecord = await getOtpByPhone(phone);
    checkExistingOtp(existingOtpRecord);

    if (!existingOtpRecord?.verifyToken) {
      return next(Errors.notVerifyPhone());
    }

    if (existingOtpRecord?.error === 5) {
      return next(Errors.requestAttack());
    }

    checkUserIfNotExit(user);

    if (user?.status === "FREEZE") {
      return next(Errors.requestAttack());
    }

    if (!user?.randomToken) {
      return next(Errors.unauthenticated());
    }

    // This is also untrusted
    if (existingOtpRecord?.verifyToken !== token) {
      const otpData = {
        error: 5,
      };
      await updateOtp(existingOtpRecord!.id, otpData);

      const userData = {
        status: "FREEZE",
      };
      await updateUser(user.id, userData);

      return next(Errors.InvalidToken());
    }

    const isExpired =
      moment().diff(existingOtpRecord?.updatedAt, "minutes") >= 10;
    if (isExpired) {
      return next(Errors.requestExpired());
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    // const fakeRandomToken = generateToken();

    const accessTokenPayload = { id: user.id };
    const refreshTokenPayload = { id: user.id, phone: user.phone };

    const accessToken = jwt.sign(
      accessTokenPayload,
      process.env.ACCESS_TOKEN_SECRET!,
      { 
        expiresIn: 2 * 60,
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
      password: hashedPassword,
      errorLoginCount: 0,
      // randomToken: refreshToken,
    };

    await updateUser(user.id, userUpdateData);

    const otpData = {
      rememberToken: generateToken(),
      verifyToken: generateToken(),
    };
    await updateOtp(existingOtpRecord.id, otpData);

    res
      .status(200)
      .json({
        success: true,
        message: "Password reset successfully.",
        userID: user.id,
        phone: user.phone,
      });
  },
];
