import { Request, Response, NextFunction } from "express";
import { body, param, query, validationResult } from "express-validator";

import { checkUserIfNotExit } from "../../utils/auth";
import { checkUploadFile } from "../../utils/check";
import { getUserByID } from "../../services/authServices";
import { getPostById, getPostWithRelations } from "../../services/postService";

interface CustomRequest extends Request {
  userId?: number;
}

export const getPost = [
  param("id", "Id must be integer").trim().notEmpty().isInt({ gt: 0 }),
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    console.log(errors);
    if (errors.length > 0) {
      const error: any = new Error(errors[0].msg);
      error.status = 400;
      error.code = "ERROR_INVALID";
    }

    const postId = parseInt(req.params.id);
    const userId = req.userId;
    const user = await getUserByID(userId!);
    checkUserIfNotExit(user);

    const post = await getPostWithRelations(postId!);

    if (!post) {
      const error: any = new Error("Post not found");
      error.status = 404;
      error.code = "ERROR_NOT_FOUND";
      return next(error);
    }

    // const modifiedPost = {
    //   id: post.id,
    //   title: post.title,
    //   content: post.content,
    //   body: post.body,
    //   image: `/optimizes/${post.image.split(".")[0]}.webp`,
    //   updatedAt: post.updatedAt.toLocaleDateString("en-US", {
    //     year: "numeric",
    //     month: "long",
    //     day: "numeric",
    //   }),
    //   fullName:
    //     (post.author.firstName ?? null) + " " + (post.author.lastName ?? null),
    //   type: post.type.name,
    //   category: post.category.name,
    //   tags: post.tags &&  post.tags.length > 0 ? post.tags.map((tag) => tag.name) : null
    // };

    res.status(200).json({ message: "OK", post });
  },
];

export const getPostsByPagination = [
  body("token", "Invalid Token").trim().notEmpty().escape(),
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = new Error(errors[0].msg);
      error.status = 400;
      error.code = "ERROR_INVALID";
    }
  },
];
