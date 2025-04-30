type ErrorConfig = {
  message: string;
  status: number;
  code: string;
};

const defaultErrors: { [key: string]: ErrorConfig } = {
  userAlreadyExists: {
    message: "User is already registered.",
    status: 409,
    code: "Error_UserAlreadyExit",
  },
  otpOverLimit: {
    message: "OTP is wrong for 5 times. Please try again tomorrow.",
    status: 401,
    code: "Error_OtpOverLimit",
  },
  invalidPhone: {
    message: "Phone number is incorrect and doesn't exist",
    status: 400,
    code: "Error_Invalid",
  },
  notRegistered: {
    message: "This user is not registered",
    status: 401,
    code: "Error_Unauthenticated",
  },
  otpRequestLimit: {
    message: "OTP is allowed to request for 3 times per day.",
    status: 405,
    code: "Error_OverLimit",
  },
  invalidToken: {
    message: "Invalid Token",
    status: 400,
    code: "Error_Invalid",
  },
  otpExpired: {
    message: "OTP is expired.",
    status: 403,
    code: "Error_OTPExpired",
  },
  requestAttack: {
    message: "This request may be attack.",
    status: 400,
    code: "Error_Attack",
  },
  accountFreeze: {
    message: "Your account is temporally freeze, please contact us.",
    status: 401,
    code: "Error_AccountFreeze",
  },

  unauthenticated: {
    message: "You are not authenticated user!",
    status: 401,
    code: "Error_Unauthenticated",
  },

  notExitPhoneNumberInOtp: {
    message: "Phone number is incorrect and doesn't exit",
    status: 400,
    code: "Error_Invalid",
  },

  notExitPhoneNumberInUser: {
    message: "This phone number is not registered",
    status: 401,
    code: "Error_Unauthenticated",
  },

  otpIncorrect: {
    message: "OTP is incorrect.",
    status: 401,
    code: "Error_Invalid",
  },

  requestExpired: {
    message: "Your request is expired. Please try again!",
    status: 403,
    code: "Error_RequestExpired",
  },

  WrongPassword: {
    message: "Password is wrong.",
    status: 401,
    code: "Error_Invalid",
  },

  checkAuthorize: {
    message: "You are not allowed user.",
    status: 403,
    code: "Error_Unauthorized",
  },

  notVerifyPhone: {
    message: "This phone number is not verified",
    status: 400,
    code: "Error_Invalid",
  },
};

export const Errors = {
  // With translations
  alreadyExitUser: (req?: any) => ({
    ...defaultErrors.userAlreadyExists,
    message: req?.t
      ? req.t("errors.userExists")
      : defaultErrors.userAlreadyExists.message,
  }),

  // Without translations (direct usage)
  otpRequestLimit: () => defaultErrors.otpRequestLimit,

  InvalidToken: () => defaultErrors.invalidToken,

  otpExpired: () => defaultErrors.otpExpired,

  requestAttack: () => defaultErrors.requestAttack,

  freezeError: () => defaultErrors.accountFreeze,

  unauthenticated: () => defaultErrors.unauthenticated,

  otpOverLimit: () => defaultErrors.otpOverLimit,

  notExitPhoneNumberInOtp: () => defaultErrors.notExitPhoneNumberInOtp,

  notExitPhoneNumberInUser: () => defaultErrors.notExitPhoneNumberInUser,

  otpIncorrect: () => defaultErrors.otpIncorrect,

  requestExpired: () => defaultErrors.requestExpired,

  wrongPassword: (req: any) => ({
    ...defaultErrors.wrongPassword,
    message: req?.t
      ? req.t("wrongPassword")
      : defaultErrors.wrongPassword.message,
  }),

  notRegistered: () => defaultErrors.notRegistered,

  checkAuthorize: () => defaultErrors.checkAuthorize,

  notVerifyPhone: () => defaultErrors.notVerifyPhone,
};
