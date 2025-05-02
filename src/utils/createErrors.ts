type ErrorConfig = {
  message: string;
  status: number;
  code: string;
};

const defaultErrors: Record<string, ErrorConfig> = {
  userAlreadyExists: {
    message: "User is already registered.",
    status: 409,
    code: "ERROR_USER_EXISTS",
  },
  otpOverLimit: {
    message: "Too many incorrect OTP attempts. Please try again tomorrow.",
    status: 401,
    code: "ERROR_OTP_LIMIT",
  },
  invalidPhone: {
    message: "The phone number is invalid.",
    status: 400,
    code: "ERROR_INVALID_PHONE",
  },
  notRegistered: {
    message: "This phone number is not registered.",
    status: 401,
    code: "ERROR_NOT_REGISTERED",
  },
  otpRequestLimit: {
    message: "OTP request limit reached. Try again later.",
    status: 429,
    code: "ERROR_OTP_REQUEST_LIMIT",
  },
  invalidToken: {
    message: "Invalid verification token.",
    status: 400,
    code: "ERROR_INVALID_TOKEN",
  },
  otpExpired: {
    message: "OTP has expired.",
    status: 403,
    code: "ERROR_OTP_EXPIRED",
  },
  requestAttack: {
    message: "Suspicious request detected.",
    status: 400,
    code: "ERROR_SUSPICIOUS_REQUEST",
  },
  accountFreeze: {
    message: "Your account is temporarily frozen. Please contact support.",
    status: 403,
    code: "ERROR_ACCOUNT_FREEZE",
  },
  unauthenticated: {
    message: "Authentication required.",
    status: 401,
    code: "ERROR_UNAUTHENTICATED",
  },
  nonExistentPhoneNumberInOtp: {
    message: "The phone number is incorrect or does not exist.",
    status: 400,
    code: "ERROR_PHONE_NOT_FOUND_OTP",
  },
  nonExistentPhoneNumberInUser: {
    message: "This phone number is not registered.",
    status: 401,
    code: "ERROR_PHONE_NOT_FOUND_USER",
  },
  otpIncorrect: {
    message: "Incorrect OTP.",
    status: 401,
    code: "ERROR_OTP_INCORRECT",
  },
  requestExpired: {
    message: "Your request has expired. Please try again.",
    status: 403,
    code: "ERROR_REQUEST_EXPIRED",
  },
  wrongPassword: {
    message: "Incorrect password.",
    status: 401,
    code: "ERROR_WRONG_PASSWORD",
  },
  unauthorized: {
    message: "You are not authorized to perform this action.",
    status: 403,
    code: "ERROR_UNAUTHORIZED",
  },
  phoneNotVerified: {
    message: "Phone number has not been verified.",
    status: 400,
    code: "ERROR_PHONE_NOT_VERIFIED",
  },
  maintenanceModeMsg: {
    message:
      "This server is currently under maintenance. Please try again later.",
    status: 503,
    code: "ERROR_MAINTENANCE",
  },
};

export const Errors = {
  alreadyExistUser: (req?: any) => ({
    ...defaultErrors.userAlreadyExists,
    message:
      req?.t?.("errors.userExists") || defaultErrors.userAlreadyExists.message,
  }),
  otpRequestLimit: () => defaultErrors.otpRequestLimit,
  invalidToken: () => defaultErrors.invalidToken,
  otpExpired: () => defaultErrors.otpExpired,
  requestAttack: () => defaultErrors.requestAttack,
  accountFreeze: () => defaultErrors.accountFreeze,
  unauthenticated: () => defaultErrors.unauthenticated,
  otpOverLimit: () => defaultErrors.otpOverLimit,
  nonExistentPhoneNumberInOtp: () => defaultErrors.nonExistentPhoneNumberInOtp,
  nonExistentPhoneNumberInUser: () =>
    defaultErrors.nonExistentPhoneNumberInUser,
  otpIncorrect: () => defaultErrors.otpIncorrect,
  requestExpired: () => defaultErrors.requestExpired,
  wrongPassword: (req?: any) => ({
    ...defaultErrors.wrongPassword,
    message: req?.t?.("wrongPassword") || defaultErrors.wrongPassword.message,
  }),
  notRegistered: () => defaultErrors.notRegistered,
  unauthorized: () => defaultErrors.unauthorized,
  phoneNotVerified: () => defaultErrors.phoneNotVerified,
  invalidPhone: () => defaultErrors.invalidPhone,
  maintenanceModeMsg: () => defaultErrors.maintenanceModeMsg,
};
