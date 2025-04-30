import { Request, Response, NextFunction } from "express";
import { query, body, validationResult } from "express-validator";
import { authorize } from "../../utils/authorize";
import { getUserByID } from "../../services/authServices";
import { checkUserIfNotExit } from "../../utils/auth";

interface CustomRequest extends Request {
  userId?: number;
}

export const changeLanguage = [
  query("lng", "Invalid language code.")
    .trim()
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
