import { Errors } from "./createErrors";

export const checkProfileUpload = (image: any) => {
  if (!image) {
    throw Errors.checkProfileImage();
  }
};
