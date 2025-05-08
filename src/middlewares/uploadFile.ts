import { Request, Response, NextFunction } from "express";
import multer, { FileFilterCallback, memoryStorage } from "multer";
import { measureMemory } from "node:vm";  

const fileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "upload/images");
    // const type = file.mimetype.split("/")[0];
    // if (type === "image") {
    //   cb(null, "upload/images");
    // } else {
    //   cb(null, "upload/files");
    // }
  },
  filename: function (req, file, cb) {
    const ext = file.mimetype.split("/")[1]
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9) + "." + ext; // 123.png
    cb(null, uniqueSuffix);
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/webp"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage: fileStorage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 10 },
});

export const uploadMemory = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 10}
})

export default upload;
