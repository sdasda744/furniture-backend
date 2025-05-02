import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { createOrUpdateMaintenanceStatus } from "../../services/maintenanceService";

interface CustomRequest extends Request {
  user?: any;
}

export const setMaintenanceMode = [
  body("mode", "Mode must be a boolean").isBoolean(),
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = new Error(errors[0].msg);
      error.status = 400;
      error.code = "Error_Invalid";
      return next(error);
    }

    const { mode } = req.body;
    const value = mode ? "true" : "false";
    const message = mode
      ? "successfully turn on maintenance mode."
      : "successfully turn off maintenance mode.";

    await createOrUpdateMaintenanceStatus("maintenance", value);

    res.status(200).json({ message: message });
  },
];
