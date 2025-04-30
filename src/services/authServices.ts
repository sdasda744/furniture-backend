import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getUserByPhone = async (phone: string) => {
  return await prisma.user.findUnique({
    where: {
      phone,
    },
  });
};

export const createOtp = async (otpData: any) => {
  const data = await prisma.otp.create({
    data: otpData,
  });

  return data;
};

export const getOtpByPhone = async (phone: string) => {
  return await prisma.otp.findUnique({
    where: {
      phone,
    },
  });
};

export const updateOtp = async (id: number, otpData: any) => {
  return await prisma.otp.update({
    where: { id },
    data: otpData,
  });
};

export const createUser = async (userData: any) => {
  const data = await prisma.user.create({
    data: userData,
  });

  return data;
};

export const updateUser = async (id: number, updateData: any) => {
  return await prisma.user.update({
    where: { id },
    data: updateData,
  });
};

export const getUserByID = async (id: number) => {
  return await prisma.user.findUnique({
    where: { id },
  });
};

// for reset password
export const updateOtpByPhone = async (phone: string, otpData: any) => {
  return await prisma.otp.update({
    where: { phone },
    data: otpData,
  });
};