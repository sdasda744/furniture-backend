import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getMaintenanceStatusByKey = async (key: string) => {
  return await prisma.maintenance.findUnique({
    where: { key },
  });
};

export const createOrUpdateMaintenanceStatus = async (
  key: string,
  value: string
) => {
  return await prisma.maintenance.upsert({
    where: { key },
    update: {
      value,
    },
    create: {
      key,
      value,
    },
  });
};
