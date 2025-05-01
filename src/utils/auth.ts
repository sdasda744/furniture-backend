import { Errors } from "./createErrors";

export const checkUserExit = (user: any) => {
  if (user) {
    // const error: any = new Error("User is already registered")
    // error.status = 409,
    // error.code = "Error_UserAlreadyExit"
    // throw error
    throw Errors.alreadyExistUser();
  }
};

export const checkOtpErrorIfSameDate = (
  isSameDate: boolean,
  errorCount: number
) => {
  if (isSameDate && errorCount >= 5) {
    // const error: any = new Error("OTP is wrong for 5 times. Please try again tomorrow.")
    // error.status = 401;
    // error.code = "Error_OverLimit";
    // throw error;
    // throw Errors.OtpOverLimit();
    throw Errors.otpOverLimit()
  }
};

export const checkExistingOtp = (otpRecord: any) => {
  if (!otpRecord) {
    // const error: any = new Error("Phone number is incorrect and doesn't exit");
    // error.status = 400;
    // error.code = "Error_Invalid"
    // throw error;
    throw Errors.nonExistentPhoneNumberInOtp();
  }
};

export const checkUserIfNotExit = (user: any) => {
  if (!user) {
    // const error: any = new Error("This phone number is not registered");
    // error.status = 401;
    // error.code = "Error_Unauthenticated";
    // throw error;

    throw Errors.nonExistentPhoneNumberInUser();
  }
};
