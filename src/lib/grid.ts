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
    // 1️⃣ Get stations
    const stations = await getChandigarhStations();

    if (!stations || stations.length === 0) {
        throw new Error("No stations available for grid generation");
    }

    const grid: GridCell[] = [];

    const latStep = GRID_RESOLUTION_METERS / METERS_PER_DEGREE_LAT;

    // 2️⃣ Loop through latitude
    for (
        let lat = CHANDIGARH_BOUNDARY.minLat;
        lat <= CHANDIGARH_BOUNDARY.maxLat;
        lat += latStep
    ) {
        const lngStep = metersToLngDegrees(
            GRID_RESOLUTION_METERS,
            lat
        );

        // 3️⃣ Loop through longitude
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
                throw new Error("Grid generation produced NaN value");
            }

            grid.push({
                lat,
                lng,
                value: pollutionValue,
            });
        }
    }

    console.log("First cell:", grid[0]);
    console.log("Last cell:", grid[grid.length - 1]);

    // 4️⃣ Store in Redis
    await redis.set(GRID_KEY, grid);
    await redis.set(GRID_TIMESTAMP_KEY, Date.now());
    await redis.set(GRID_STATUS_KEY, "fresh");

    return {
        cellCount: grid.length,
    };
}
