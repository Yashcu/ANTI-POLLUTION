import { redis } from "@/infrastructure/redis";
import { CircuitBreaker } from "@/infrastructure/circuitBreaker";
import { logInfo } from "@/infrastructure/logger";

const GEOCODE_TTL = 86400; // 24 hours
const USER_AGENT = "AntiPollutionRouteTracker/1.0 (https://github.com/yash/anti-pollution)";

const nominatimBreaker = new CircuitBreaker("Nominatim", 5, 30_000);

export interface GeocodeResult {
    lat: number;
    lng: number;
    label: string;
}

export async function geocode(query: string): Promise<GeocodeResult | null> {
    const cacheKey = `geocode:${query.toLowerCase().trim()}`;

    const cached = await redis.get<GeocodeResult>(cacheKey);
    if (cached) {
        logInfo("geocode_cache_hit", { query });
        return cached;
    }

    const structuredQuery = `${query}, Chandigarh, India`;

    const response = await nominatimBreaker.execute(() =>
        fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                structuredQuery
            )}&limit=5&countrycodes=in&viewbox=76.75,30.78,76.85,30.65&bounded=1`,
            { headers: { "User-Agent": USER_AGENT } }
        )
    );

    if (!response.ok) {
        throw new Error("Geocoding service unavailable");
    }

    const data = await response.json();

    if (!data || data.length === 0) {
        return null;
    }

    const bestMatch = data[0];

    const result: GeocodeResult = {
        lat: parseFloat(bestMatch.lat),
        lng: parseFloat(bestMatch.lon),
        label: bestMatch.display_name,
    };

    await redis.set(cacheKey, result, { ex: GEOCODE_TTL });

    return result;
}
