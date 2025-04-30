import { PrismaClient, Prisma } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

// const userData: Prisma.UserCreateInput[] = [
//   {
//     phone: "778899001",
//     password: "",
//     randomToken: "mckajdizdkjkJDI28akj",
//   },
//   {
//     phone: "778899002",
//     password: "",
//     randomToken: "mckajdizdkjkJDI28akj",
//   },
//   {
//     phone: "778899003",
//     password: "",
//     randomToken: "mckajdizdkjkJDI28akj",
//   },
//   {
//     phone: "778899004",
//     password: "",
//     randomToken: "mckajdizdkjkJDI28akj",
//   },
//   {
//     phone: "778899005",
//     password: "",
//     randomToken: "mckajdizdkjkJDI28akj",
//   },
// ];

export function createRandomUser() {
  return {
    phone: faker.phone.number({ style: "international" }),
    password: faker.internet.password(),
    randomToken: faker.internet.jwt(),
  };
}

export const userData: Prisma.UserCreateInput[] = faker.helpers.multiple(
  createRandomUser,
  {
    count: 5,
  }
);

const main = async () => {
  console.log("Start seeding...");
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash("12345678", salt); // Add a default password

  for (const user of userData) {
    user.password = hashedPassword;
    const createdUser = await prisma.user.create({
      data: user,
    });
    console.log(`Created user with phone: ${createdUser.phone}`);
  }

  console.log("Seeding finished...");
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
