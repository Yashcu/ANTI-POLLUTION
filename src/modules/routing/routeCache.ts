import { redis } from "@/infrastructure/redis";
import { CachedRoutePayload } from "@/modules/routing/types";

const ROUTE_TTL_SECONDS = 60 * 20;

const MEMORY_TTL_MS = 60_000;
const MAX_MEMORY_ENTRIES = 500;

const memoryRouteCache = new Map<string, {
    payload: CachedRoutePayload;
    cachedAt: number;
}>();

function round(num: number): number {
    return Number(num.toFixed(4));
}

export function buildRouteCacheKey(
    origin: [number, number],
    destination: [number, number]
): string {
    return `route:${round(origin[0])}:${round(origin[1])}:${round(destination[0])}:${round(destination[1])}`;
}

export async function getCachedRoute(key: string) {
    const memoryHit = memoryRouteCache.get(key);

    if (memoryHit && Date.now() - memoryHit.cachedAt < MEMORY_TTL_MS) {
        return memoryHit.payload;
    }

    const redisValue = await redis.get<CachedRoutePayload>(key);

    if (redisValue) {
        memoryRouteCache.set(key, {
            payload: redisValue,
            cachedAt: Date.now()
        });
    }

    return redisValue;
}

export async function setCachedRoute(key: string, payload: CachedRoutePayload) {
    if (memoryRouteCache.size >= MAX_MEMORY_ENTRIES) memoryRouteCache.clear();

    memoryRouteCache.set(key, {
        payload,
        cachedAt: Date.now()
    });

    await redis.set(key, payload, { ex: ROUTE_TTL_SECONDS });
}
