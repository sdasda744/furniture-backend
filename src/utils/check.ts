import { Errors } from "./createErrors";

export const checkUploadFile = (image: any) => {
  if (!image) {
    throw Errors.checkProfileImage();
  }
};

export const checkModelIfExist = (model: any) => {
  if (!model) {
    throw Errors.modelDoesNotExit();
  }
}
