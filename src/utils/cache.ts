import { redis } from "../config/redisClient";

export const getOrSetCache = async (key: string, cb: () => Promise<any>) => {
  try {
    const cachedData = await redis.get(key);
    if (cachedData) {
      console.log("Cache hit");
      return JSON.parse(cachedData);
    }
    console.log("Cache miss");
    const data = await cb();
    await redis.setex(key, 3600, JSON.stringify(data)); // Cache for 1 hour
    return data;
  } catch (error) {
    console.error("Error getting or setting cache:", error);
    throw error;
  }
};
