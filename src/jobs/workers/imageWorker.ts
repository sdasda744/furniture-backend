import { Worker, Job } from "bullmq";
import { Redis } from "ioredis";
import sharp from "sharp";
import path from "path";

const connection = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT!) || 6379,
  maxRetriesPerRequest: null

});

const imageWorker = new Worker(
  "imageQueue",
  async (job) => {
    const { filePath, fileName } = job.data;

    const optimizeImage = path.join(
      __dirname,
      "../../..",
      "upload/optimizes",
      fileName
    );
    await sharp(filePath)
      .resize(200, 200)
      .webp({ quality: 50 })
      .toFile(optimizeImage);
  },
  { connection }
);

imageWorker.on("completed", (job) => {
  console.log("Job complemented with ID: ", job.id);
})

imageWorker.on("failed", (job: any, error) => {
  console.log(`Job ${job.id} failed with ${error.message}`);
})
