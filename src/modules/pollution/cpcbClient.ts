import { redis } from "@/infrastructure/redis";
import { env } from "@/shared/env";
import { CPCBRecord, CPCBApiResponse, Station } from "@/modules/pollution/types";
import { CircuitBreaker } from "@/infrastructure/circuitBreaker";
import { logInfo, logError } from "@/infrastructure/logger";

const API_URL = "https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69";
const API_KEY = env.CPCB_API_KEY;

const CACHE_KEY = "cpcb:chandigarh:pm25";
const CACHE_TTL = 60 * 10; // 10 minutes

const FRESH_THRESHOLD_MS = 60 * 60 * 1000;   // 60 min
const HARD_CUTOFF_MS = 180 * 60 * 1000;       // 180 min

const cpcbBreaker = new CircuitBreaker("CPCB", 5, 30_000);

function parseCPCBDate(dateStr: string): number {
    if (!dateStr || !dateStr.includes(" ") || !dateStr.includes("-")) return NaN;

    const [datePart, timePart] = dateStr.split(" ");
    const [day, month, year] = datePart.split("-");
    const [hour, minute, second] = timePart.split(":");

    const utcMillis = Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second || 0)
    );

    return utcMillis - (5.5 * 60 * 60 * 1000);
}

export async function getChandigarhStations(): Promise<{
    stations: Station[];
    quality: "fresh" | "degraded";
}> {

    const NOW = Date.now();

    // Check Redis cache first
    const cached = await redis.get<{ stations: Station[]; quality: "fresh" | "degraded"; }>(CACHE_KEY);
    if (cached) return cached;

    logInfo("cpcb_fetch_start");

    const url = `${API_URL}?api-key=${API_KEY}&format=json&filters[state]=Chandigarh&filters[pollutant_id]=PM2.5&limit=100`;

    const start = Date.now();
    let response;

    try {
        response = await cpcbBreaker.execute(() => fetch(url));
        logInfo("cpcb_fetch", { latency_ms: Date.now() - start });
    } catch (err) {
        logError("cpcb_fetch_failed", {
            latency_ms: Date.now() - start,
            error: err instanceof Error ? err.message : "Unknown CPCB Error"
        });
        throw err;
    }


    if (!response.ok) {
        throw new Error("Failed to fetch CPCB data");
    }

    const data: CPCBApiResponse = await response.json();

    if (!data.records || !Array.isArray(data.records)) {
        throw new Error("Invalid CPCB response format");
    }

    const candidates = data.records
        .filter((record: CPCBRecord) => record.avg_value !== "NA")
        .map((record: CPCBRecord) => {
            const parsedTime = parseCPCBDate(record.last_update);
            return {
                lat: parseFloat(record.latitude),
                lng: parseFloat(record.longitude),
                value: parseFloat(record.avg_value),
                lastUpdate: record.last_update,
                parsedTime
            };
        });

    const validStations = candidates.filter(station => {
        if (
            isNaN(station.lat) ||
            isNaN(station.lng) ||
            isNaN(station.value)
        ) return false;

        const age = NOW - station.parsedTime;

        if (isNaN(station.parsedTime)) return false;

        // Reject completely if older than hard cutoff
        if (age > HARD_CUTOFF_MS) return false;

        return true;
    });

    const hasDegradedStations = validStations.some(station => {
        const age = NOW - station.parsedTime;
        return age > FRESH_THRESHOLD_MS;
    });

    const stations: Station[] = validStations.map(s => ({
        lat: s.lat,
        lng: s.lng,
        value: s.value,
        lastUpdate: s.lastUpdate
    }));

    const gridQuality = hasDegradedStations ? "degraded" : "fresh";

    if (stations.length === 0) {
        return {
            stations: [],
            quality: "degraded"
        };
    }

    // Cache result
    await redis.set(CACHE_KEY, { stations, quality: gridQuality }, { ex: CACHE_TTL });

    return {
        stations,
        quality: gridQuality,
    }
}
