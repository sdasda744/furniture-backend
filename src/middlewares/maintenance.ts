import { Request, Response, NextFunction } from "express";
import { getMaintenanceStatusByKey } from "../services/maintenanceService";
import { Errors } from "../utils/createErrors";

const whiteList = ["127.0.0.1", "::1"];

export const maintenanceMode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const ip: any = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  if (whiteList.includes(ip)) {
    console.log("IP OK", ip);
   return next();
  } else {
    console.log("Bad IP", ip);
    const maintenance = await getMaintenanceStatusByKey("maintenance");
    console.log("Maintenance status is", maintenance?.value);

    if (maintenance?.value === "true") {
      return next(Errors.maintenanceModeMsg());
    }
  }

  next();
};
