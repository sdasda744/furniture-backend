import { Request, Response, NextFunction } from "express";
import { body, param, query, validationResult } from "express-validator";

import { checkUserIfNotExit } from "../../utils/auth";
import { checkUploadFile } from "../../utils/check";
import { getUserById } from "../../services/authServices";
import {
  getPostById,
  getPostLists,
  getPostWithRelations,
} from "../../services/postService";

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
    const user = await getUserById(userId!);
    checkUserIfNotExit(user);

    const post = await getPostWithRelations(postId!);

    // if (!post) {
    //   const error: any = new Error("Post not found");
    //   error.status = 404;
    //   error.code = "ERROR_NOT_FOUND";
    //   return next(error);
    // }

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
  query("page", "page must be positive integer.").isInt({ gt: 0 }).optional(),
  query("limit", "limit must be positive integer.").isInt({ gt: 4 }).optional(),
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = new Error(errors[0].msg);
      error.status = 400;
      error.code = "ERROR_INVALID";
      return next(error);
    }

    const page = req.query.page || 1;
    const limit = req.query.limit || 5;
    const userId = req.userId;
    const user = await getUserById(userId!);
    checkUserIfNotExit(user);

    const skip = (+page - 1) * +limit;

    const options = {
      skip,
      take: +limit + 1,
      select: {
        id: true,
        image: true,
        content: true,
        updatedAt: true,
        author: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    };

    const posts = await getPostLists(options);

    const previousPage = +page !== 1 ? +page - 1 : null;

    const hasNextPage = posts.length > +limit;
    console.log(posts.length, +limit);
    let nextPage = null;
    if (hasNextPage) {
      posts.pop();
      nextPage = +page + 1;
    }
    console.log("next page is ", nextPage);

    res.status(200).json({
      message: "Get all posts",
      totalPost: posts.length,
      pageInfo: {
        previousPage,
        currentPage: +page,
        nextPage,
      },
      posts,
    });
  },
];

export const getInfinitePostsByPagination = [
  query("cursor", "Cursor must be Post ID.").isInt({ gt: 0 }).optional(),
  query("limit", "Limit number must be unsigned integer.")
    .isInt({ gt: 4 })
    .optional(),
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = new Error(errors[0].msg);
      error.status = 400;
      error.code = "ERROR_INVALID";
      return next(error);
    }

    //   const lastCursor = req.query.cursor;
    //   const limit = req.query.limit || 5;

    //   const userId = req.userId;
    //   const user = await getUserById(userId!);
    //   checkUserIfNotExit(user);

    //   const options = {
    //     take: +limit + 1,
    //     skip: lastCursor ? 1 : 0,
    //     cursor: lastCursor ? { id: +lastCursor } : undefined,
    //     select: {
    //       id: true,
    //       title: true,
    //       content: true,
    //       image: true,
    //       updatedAt: true,
    //       author: {
    //         select: {
    //           fullName: true,
    //         },
    //       },
    //     },
    //     orderBy: {
    //       id: "asc",
    //     },
    //   };

    //   const posts = await getPostLists(options);
    //   console.log(posts.length);

    //   const hasNextPage = posts.length > +limit;
    //   if (hasNextPage) {
    //     posts.pop();
    //   }

    //   const newCursor = posts.length > 0 ? posts[posts.length - 1].id : null;

    //   res.status(200).json({
    //     message: "Get all posts successfully",
    //     pageInfo: {
    //       hasNextPage,
    //       newCursor,
    //     },
    //     posts,
    //   });
    // },
    const lastCursor = req.query.cursor;
    const limit = req.query.limit || 5;

    const userId = req.userId;
    const user = await getUserById(userId!);
    checkUserIfNotExit(user);

    const options = {
      take: +limit + 1,
      skip: lastCursor ? 1 : 0,
      cursor: lastCursor ? { id: +lastCursor } : undefined,
      select: {
        id: true,
        title: true,
        content: true,
        image: true,
        updatedAt: true,
        author: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    };

    const posts = await getPostLists(options);
    console.log(posts.length);

    const hasNextPage = posts.length > +limit;

    if (hasNextPage) {
      posts.pop();
    }

    const newCursor = posts.length > 0 ? posts[posts.length - 1].id : null;

    res.status(200).json({
      message: "Get All infinite posts",
      hasNextPage,
      newCursor,
      posts,
    });
  },
];
