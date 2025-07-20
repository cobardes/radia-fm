import { Redis } from "@upstash/redis";

// Create Redis client for session management
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

export default redis;
