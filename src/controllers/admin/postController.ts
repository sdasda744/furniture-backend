import { Request, Response, NextFunction } from "express";
import { body, query, validationResult } from "express-validator";
import sanitizeHtml from "sanitize-html";
import path, { join } from "path";
import { unlink } from "fs/promises";

import { checkUserIfNotExit } from "../../utils/auth";
import { checkModelIfExist, checkUploadFile } from "../../utils/check";
import { getUserByID } from "../../services/authServices";
import ImageQueue from "../../jobs/queues/imageQueue";
import {
  createSinglePost,
  deleteSinglePost,
  getPostById,
  PostArgs,
  updateSinglePost,
} from "../../services/postService";
import { Errors } from "../../utils/createErrors";

interface CustomRequest extends Request {
  userId?: number;
}

const removeFile = async (
  originalFile: string,
  optimizeFile: string | null
) => {
  try {
    const originalFilePath = join(
      __dirname,
      "../../..",
      "upload/images",
      originalFile
    );
    await unlink(originalFilePath);

    if (optimizeFile) {
      const optimizeFilePath = join(
        __dirname,
        "../../..",
        "upload/optimizes",
        optimizeFile
      );
      await unlink(optimizeFilePath);
    }
  } catch (error) {
    console.error(error);
  }
};

export const createPost = [
  body("title", "Title is required.").trim().notEmpty().escape(),
  body("content", "Content is required.").trim().notEmpty().escape(),
  body("body", "Body is required.")
    .trim()
    .notEmpty()
    .customSanitizer((value) => sanitizeHtml(value))
    .notEmpty(),
  body("category", "Category is required.").trim().notEmpty().escape(),
  body("type", "Type is required.").trim().notEmpty().escape(),
  body("tags", "Tag is invalid")
    .optional({ nullable: true })
    .customSanitizer((value) => {
      if (value) {
        return value.split(",").filter((tag: string) => tag.trim() !== "");
      }
      return value;
    }),

  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      if (req.file) {
        await removeFile(req.file.filename, null);
      }
      const error: any = new Error(errors[0].msg);
      error.status = 400;
      error.code = "ERROR_INVALID";
      return next(error);
    }

    const { title, content, body, category, type, tags } = req.body;
    checkUploadFile(req.file);

    const userId = req.userId;
    const user = await getUserByID(userId!);
    if (!user) {
      if (req.file) {
        await removeFile(req.file.filename, null);
      }
      const error: any = new Error("This user is not registered.");
      error.status = 400;
      error.code = "ERROR_NOT_REGISTERED";
      return next(error);
    }

    const splitFileName = req.file?.filename.split(".")[0];
    const job = await ImageQueue.add(
      "optimize-image",
      {
        filePath: req.file?.path,
        fileName: `${splitFileName}.webp`,
        width: 835,
        height: 577,
        quality: 100,
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
      }
    );

    const data: PostArgs = {
      title,
      content,
      body,
      image: req.file!.filename,
      authorId: user!.id,
      category,
      type,
      tags,
    };

    const post = await createSinglePost(data);

    res.status(201).json({
      success: true,
      message: "Created new post successfully.",
      postId: post.id,
      jobId: job.id,
    });
  },
];

export const updatePost = [
  body("postId", "Post id is invalid.").trim().notEmpty().isInt({ min: 1 }),
  body("title", "Title is required.").trim().notEmpty().escape(),
  body("content", "Content is required.").trim().notEmpty().escape(),
  body("body", "Body is required.")
    .trim()
    .notEmpty()
    .customSanitizer((value) => sanitizeHtml(value))
    .notEmpty(),
  // body("body", "Body is required.")
  // .trim()
  // .notEmpty()
  // .customSanitizer((value) => sanitizeHtml(value))
  // .notEmpty(),
  body("category", "Category is required.").trim().notEmpty().escape(),
  body("type", "Type is required.").trim().notEmpty().escape(),
  body("tags", "Tag is invalid.")
    .trim()
    .notEmpty()
    .escape()
    .optional({ nullable: true })
    .customSanitizer((value) => {
      if (value) {
        return value.split(",").filter((tag: string) => tag.trim() !== "");
      }
      return value;
    }),

  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      if (req.file) {
        await removeFile(req.file.filename, null);
      }
      const error: any = new Error(errors[0].msg);
      error.status = 400;
      error.code = "ERROR_INVALID";
    }

    const { postId, title, body, content, category, type, tags } = req.body;

    const userId = req.userId;
    const user = await getUserByID(userId!);
    if (!user) {
      if (req.file) {
        await removeFile(req.file.filename, null);
      }
      const error: any = new Error("This user is not registered.");
      error.status = 400;
      error.code = "ERROR_NOT_REGISTERED";
      return next(error);
    }

    const post = await getPostById(+postId);
    if (!post) {
      if (req.file) {
        await removeFile(req.file.filename, null);
      }
      return next(Errors.modelDoesNotExit);
    }

    if (user.id !== post.authorId) {
      if (req.file) {
        await removeFile(req.file.filename, null);
      }
      return next(Errors.unauthorized);
    }

    const postData: any = {
      title,
      content,
      body,
      image: req.file,
      category,
      type,
      tags,
    };

    if (req.file) {
      postData.image = req.file.filename;

      const splitFileName = req.file.filename.split(".")[0];

      await ImageQueue.add(
        "optimize-image",
        {
          filePath: req.file.path,
          fileName: `${splitFileName}.webp`,
          width: 835,
          height: 577,
          quality: 100,
        },
        {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 1000,
          },
        }
      );

      const optimizedFile = post.image.split(".")[0] + ".webp";
      await removeFile(post.image, optimizedFile);
    }

    const postUpdated = await updateSinglePost(post.id, postData);

    res.status(200).json({
      success: true,
      message: "Updated a post successfully",
      postId: postUpdated.id,
    });
  },
];

export const deletePost = [
  body("postId", "Post id is invalid").trim().notEmpty().isInt({ min: 1 }),
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = new Error(errors[0].msg);
      error.status = 400;
      error.code = "ERROR_INVALID";
    }

    const userId = req.userId;
    const postId = req.body.postId;
    const user = await getUserByID(userId!);
    const post = await getPostById(+postId);
    checkUserIfNotExit(user);
    checkModelIfExist(post)
    
    if (user!.id !== post!.authorId) {
      return next(Errors.unauthorized())
    }

    const deletedPost = await deleteSinglePost(post!.id);
    const optimizedFile = post!.image.split(".")[0] + ".webp";
    await removeFile(post!.image, optimizedFile);

    res.status(200).json({message: "Post is deleted successfully.", postId: deletedPost.id})
  },
];
