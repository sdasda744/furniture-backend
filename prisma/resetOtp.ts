// prisma/resetOtpRow.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Delete all OTP records
  await prisma.otp.deleteMany();

  // Reset auto-increment (adjust based on your DB)
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE OtpRow;`);

  console.log('OTP rows cleared and ID reset!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
