import { redis } from "@/lib/redis";

const API_URL = "https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69";
const API_KEY = process.env.CPCB_API_KEY!;

const CACHE_KEY = "cpcb:chandigarh:pm25";
const CACHE_TTL = 60 * 10; // 10 minutes

const FRESH_THRESHOLD_MS = 60 * 60 * 1000;   // 60 min
const HARD_CUTOFF_MS = 180 * 60 * 1000;       // 180 min

export type Station = {
    lat: number;
    lng: number;
    value: number;
    lastUpdate: string;
};

function parseCPCBDate(dateStr: string): number {
    const [datePart, timePart] = dateStr.split(" ");
    const [day, month, year] = datePart.split("-");
    return new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        ...timePart.split(":").map(Number)
    ).getTime();
}

export async function getChandigarhStations(): Promise<{
    stations: Station[];
    quality: "fresh" | "degraded";
}> {

    const NOW = Date.now();

    // Check Redis cache first
    const cached = await redis.get<{ stations: Station[]; quality: "fresh" | "degraded"; }>(CACHE_KEY);
    if (cached) return cached;

    const url = `${API_URL}?api-key=${API_KEY}&format=json&filters[state]=Chandigarh&filters[pollutant_id]=PM2.5&limit=100`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Failed to fetch CPCB data");
    }

    const data = await response.json();

    if (!data.records || !Array.isArray(data.records)) {
        throw new Error("Invalid CPCB response format");
    }

    const stations: Station[] = data.records
        .filter((record: any) => record.avg_value !== "NA")
        .map((record: any) => ({
            lat: parseFloat(record.latitude),
            lng: parseFloat(record.longitude),
            value: parseFloat(record.avg_value),
            lastUpdate: record.last_update,
        }))
        .filter((station: Station) => {
            if (
                isNaN(station.lat) ||
                isNaN(station.lng) ||
                isNaN(station.value)
            ) return false;

            const lastUpdateTime = parseCPCBDate(station.lastUpdate);
            const age = NOW - lastUpdateTime;

            if (isNaN(lastUpdateTime)) return false;

            // Reject completely if older than hard cutoff
            if (age > HARD_CUTOFF_MS) return false;

            return true;
        });

    const degradedStations = stations.filter(station => {
        const lastUpdateTime = parseCPCBDate(station.lastUpdate);
        const age = NOW - lastUpdateTime;
        return age > FRESH_THRESHOLD_MS;
    })

    const gridQuality = degradedStations.length > 0 ? "degraded" : "fresh";

    console.log(
        "Station age(min):",
        (NOW - parseCPCBDate(stations[0].lastUpdate)) / 60000
    );


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
