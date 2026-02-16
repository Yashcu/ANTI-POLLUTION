import { redis } from "@/lib/redis";

export async function rateLimit(ip: string) {
  const key = `ratelimit:${ip}`;

  const requests = await redis.incr(key);

  if (requests === 1) {
    await redis.expire(key, 60 * 60); // 1 hour window
  }

  return requests;
}
