import { redis } from "@/lib/redis";

const API_URL = "https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69";
const API_KEY = process.env.CPCB_API_KEY!;

const CACHE_KEY = "cpcb:chandigarh:pm25";
const CACHE_TTL = 60 * 10; // 10 minutes

export type Station = {
    lat: number;
    lng: number;
    value: number;
    lastUpdate: string;
};

export async function getChandigarhStations(): Promise<Station[]> {
    // Check Redis cache first
    const cached = await redis.get<Station[]>(CACHE_KEY);
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
        .filter(
            (station: Station) =>
                !isNaN(station.lat) &&
                !isNaN(station.lng) &&
                !isNaN(station.value)
        );

    if (stations.length === 0) {
        throw new Error("No valid PM2.5 stations found");
    }

    // Cache result
    await redis.set(CACHE_KEY, stations, { ex: CACHE_TTL });

    return stations;
}
