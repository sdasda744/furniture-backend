import { Request, Response, NextFunction } from "express";
import { query, body, validationResult } from "express-validator";
import { authorize } from "../../utils/authorize";
import { getUserByID, updateUser } from "../../services/authServices";
import { checkUserIfNotExit } from "../../utils/auth";
import { checkUploadFile } from "../../utils/check";
import { unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import ImageQueue from "../../jobs/queues/imageQueue";

interface CustomRequest extends Request {
  userId?: number;
}

export const changeLanguage = [
  query("lng", "Invalid language code.")
    .notEmpty()
    .matches(/^[a-z]+$/)
    .isLength({ min: 2, max: 3 }),

  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = new Error(errors[0].msg);
      error.status = 400;
      error.code = "Error_Invalid";
      return next(error);
    }

    const { lng } = req.query;
    res.cookie("i18next", lng);
    res.status(200).json({ message: req.t("changeLang", { lang: lng }) });
  },
];

export const testPermission = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const userId = req.userId;
  const user = await getUserByID(userId!);
  checkUserIfNotExit(user);

  const info: any = {
    title: "Test Permission",
  };

  const store = authorize(true, "AUTHOR", user!.role);
  if (store) {
    info.content = "You will see this message if you are authorize user.";
  }

  res.status(200).json({ message: info });
};

export const uploadProfile = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const userId = req.userId;
  const image = req.file;
  const user = await getUserByID(userId!);
  checkUserIfNotExit(user);
  checkUploadFile(image);

  console.log("image file name is -------", image);
  const fileName = image!.filename;

  if (user?.image) {
    try {
      const filePath = path.join(
        __dirname,
        "../../../",
        "/upload/images",
        user.image
      );
      await unlink(filePath);
    } catch (error) {
      console.log("Error deleting files: ", error);
    }
  }

  const userData = {
    image: fileName,
  };
  await updateUser(user!.id, userData);
  res.status(200).json({ message: "Profile picture uploaded successfully." });
};

export const getMyPhoto = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const file = path.join(
    __dirname,
    "../../../",
    "upload/images",
    "1746338017865-389222092-Screenshot 2025-03-03 at 13.37.50.png"
  );

  res.sendFile(file, (err) => {
    res.send(err);
  });
};

export const uploadMultiplePhoto = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  console.log("Images -------", req.files);
  res.status(200).json({ message: "Multiple picture uploaded successfully." });
};

export const uploadPhotoOptimize = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const userId = req.userId;
  const image = req.file;
  const user = await getUserByID(userId!);
  checkUserIfNotExit(user);
  checkUploadFile(image);

  const splitFileName = req.file?.filename.split(".")[0];

  // try {
  //   const imageOptimizePath = path.join(
  //     __dirname,
  //     "../../..",
  //     "upload/images",
  //     filename
  //   );
  //   await sharp(req.file?.buffer)
  //     .resize(200, 200)
  //     .webp({ quality: 50 })
  //     .toFile(imageOptimizePath);
  // } catch (error) {
  //   console.error(error);
  //   res.status(500).json({ message: "Image optimization failed." });
  //   return;
  // }

  const job = await ImageQueue.add(
    "optimize-image",
    {
      filePath: req.file?.path,
      fileName: `${splitFileName}.webp`,
      width: 200,
      height: 200,
      quality: 50,
    },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
    }
  );

  if (user!.image) {
    try {
      const originalUploadPath = path.join(
        __dirname,
        "../../../",
        "upload/images",
        user!.image!
      );
      const optimizeUploadPath = path.join(
        __dirname,
        "../../..",
        "upload/optimizes",
        user!.image!.split(".")[0] + ".webp"
      );

      await unlink(originalUploadPath);
      await unlink(optimizeUploadPath);
    } catch (error) {
      console.error(error);
    }
  }

  const userData = {
    image: req.file?.filename,
  };

  await updateUser(user!.id, userData);

  res.status(200).json({
    message: "Image optimization successfully.",
    imageFileName: splitFileName + ".webp",
    job: job.id,
  });
};
