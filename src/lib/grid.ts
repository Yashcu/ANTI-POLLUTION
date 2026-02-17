import { getChandigarhStations } from "./cpcb";
import { estimatePollution } from "./interpolation";
import { CHANDIGARH_BOUNDARY, GRID_RESOLUTION_METERS } from "./city";
import { redis } from "./redis";

export type GridCell = {
    lat: number;
    lng: number;
    value: number;
};

const GRID_KEY = "grid:chandigarh:data";
const GRID_TIMESTAMP_KEY = "grid:chandigarh:timestamp";
const GRID_STATUS_KEY = "grid:chandigarh:status";

const METERS_PER_DEGREE_LAT = 111000;

// Convert meters → longitude degrees (varies by latitude)
function metersToLngDegrees(meters: number, lat: number): number {
    const metersPerDegreeLng =
        111000 * Math.cos((lat * Math.PI) / 180);

    return meters / metersPerDegreeLng;
}

export async function buildPollutionGrid() {
    try {
        const stations = await getChandigarhStations();

        if (!stations || stations.length === 0) {
            throw new Error("No stations available");
        }

        const grid: GridCell[] = [];

        const latStep = GRID_RESOLUTION_METERS / METERS_PER_DEGREE_LAT;

        for (
            let lat = CHANDIGARH_BOUNDARY.minLat;
            lat <= CHANDIGARH_BOUNDARY.maxLat;
            lat += latStep
        ) {
            const lngStep = metersToLngDegrees(
                GRID_RESOLUTION_METERS,
                lat
            );

            for (
                let lng = CHANDIGARH_BOUNDARY.minLng;
                lng <= CHANDIGARH_BOUNDARY.maxLng;
                lng += lngStep
            ) {
                const pollutionValue = estimatePollution(
                    lat,
                    lng,
                    stations
                );

                if (isNaN(pollutionValue)) {
                    throw new Error("Interpolation produced NaN");
                }

                grid.push({
                    lat,
                    lng,
                    value: pollutionValue,
                });
            }
        }

        // Save new grid only if successful
        await redis.set(GRID_KEY, grid);
        await redis.set(GRID_TIMESTAMP_KEY, Date.now());
        await redis.set(GRID_STATUS_KEY, "fresh");

        return {
            cellCount: grid.length,
            status: "fresh",
        };

    } catch (error: any) {
        console.error("Grid rebuild failed:", error.message);

        // If rebuild fails, mark status degraded
        await redis.set(GRID_STATUS_KEY, "degraded");

        return {
            error: error.message,
            status: "degraded",
        };
    }
}

export async function getGridStatus() {
    const timestamp = await redis.get<number>(GRID_TIMESTAMP_KEY);
    const status = await redis.get<string>(GRID_STATUS_KEY);

    if (!timestamp) {
        return { status: "stale", ageMinutes: null };
    }

    const ageMs = Date.now() - timestamp;
    const ageMinutes = ageMs / (1000 * 60);

    if (ageMinutes > 360) {
        return { status: "stale", ageMinutes };
    }

    if (ageMinutes > 30) {
        return { status: "degraded", ageMinutes };
    }

    return { status: status || "fresh", ageMinutes };
}
