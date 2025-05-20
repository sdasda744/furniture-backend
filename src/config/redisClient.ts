import { Redis } from "ioredis";

export const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT!) || 6379,
  password: process.env.REDIS_PASSWORD,
  username: process.env.REDIS_USERNAME,
  maxRetriesPerRequest: null, // for bullMq
  // retryStrategy: (times) => {
  //   if (times > 3) {
  //     return null;
  //   }
  //   return Math.min(times * 100, 3000);
  // },
});

// export const redisClient = redis.duplicate();
// redisClient.on("error", (err) => {
//   console.error("Redis Client Error", err);
// }
// );
