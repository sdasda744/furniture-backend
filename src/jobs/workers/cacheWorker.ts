import { Worker } from "bullmq";

import { redis } from "../../config/redisClient";

const cacheWorker = new Worker(
  "cache-invalidation",
  async (job) => {
    const { pattern } = job.data;
    await invalidateCache(pattern);
  },
  {
    connection: redis,
    concurrency: 5,
  }
);

cacheWorker.on("completed", (job) => {
  console.log("Job complemented with ID: ", job.id);
});

cacheWorker.on("failed", (job: any, error) => {
  console.log(`Job ${job.id} failed with ${error.message}`);
});

const invalidateCache = async (pattern: string) => {
  try {
    // Create a stream to scan keys matching the pattern
    const stream = redis.scanStream({
      match: pattern,
      count: 100,
    });

    // Create a pipeline to batch delete keys
    // This is more efficient than deleting keys one by one
    // as it reduces the number of round trips to the Redis server
    // and allows for better performance
    // when deleting a large number of keys
    // The pipeline allows you to queue multiple commands
    const pipeline = redis.pipeline();
    let totalKeys = 0;

    // Use the stream to scan keys matching the pattern
    // and delete them in batches
    stream.on("data", (keys: string[]) => {
      if (keys.length > 0) {
        keys.forEach((key) => {
          pipeline.del(key); // Delete the key
          totalKeys++;
        });
      }
    });

    // wrap up the stream
    await new Promise<void>((resolve, reject) => {
      stream.on("end", async () => {
        try {
          // Execute the pipeline after all keys have been processed
          // and the stream has ended
          if (totalKeys > 0) {
            await pipeline.exec(); // Execute the pipeline
            console.log(
              `Deleted ${totalKeys} keys matching pattern: ${pattern}`
            );
          }
          resolve(); // Resolve the promise when done
        } catch (execError) {
          reject(execError); // Reject the promise if pipeline execution fails
        }
      });
      stream.on("error", (err) => {
        reject(err); // Reject the promise if an error occurs in the stream
      });
    });
  } catch (error) {
    console.error("Error invalidating cache:", error);
    throw error;
  }
};
