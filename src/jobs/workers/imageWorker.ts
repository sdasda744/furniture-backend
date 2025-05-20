import { Worker, Job } from "bullmq";
import { Redis } from "ioredis";
import sharp from "sharp";
import path from "path";

import { redis } from "../../config/redisClient";

const imageWorker = new Worker(
  "imageQueue",
  async (job) => {
    const { filePath, fileName, width, height, quality } = job.data;

    const optimizeImage = path.join(
      __dirname,
      "../../..",
      "/upload/optimizes",
      fileName
    );
    await sharp(filePath)
      .resize(width, height)
      .webp({ quality })
      .toFile(optimizeImage);
  },
  { connection: redis }
);

imageWorker.on("completed", (job) => {
  console.log("Job complemented with ID: ", job.id);
})

imageWorker.on("failed", (job: any, error) => {
  console.log(`Job ${job.id} failed with ${error.message}`);
})
