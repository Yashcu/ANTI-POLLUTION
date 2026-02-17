import { getChandigarhStations } from "./cpcb";
import { estimatePollution } from "./interpolation";
import { CHANDIGARH_BOUNDARY, GRID_RESOLUTION_METERS } from "./city";
import { redis } from "./redis";

export type GridCell = {
    lat: number;
    lng: number;
    value: number;
};

export type GridData = {
    cells: GridCell[][];
    latStep: number;
    lngStep: number;
    rows: number;
    cols: number;
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

        const latStep = GRID_RESOLUTION_METERS / METERS_PER_DEGREE_LAT;

        const rows = Math.ceil(
            (CHANDIGARH_BOUNDARY.maxLat - CHANDIGARH_BOUNDARY.minLat) / latStep
        );

        const cells: GridCell[][] = [];

        for (let row = 0; row < rows; row++) {
            const lat =
                CHANDIGARH_BOUNDARY.minLat + row * latStep;

            const lngStep = metersToLngDegrees(
                GRID_RESOLUTION_METERS,
                lat
            );

            const cols = Math.ceil(
                (CHANDIGARH_BOUNDARY.maxLng - CHANDIGARH_BOUNDARY.minLng) / lngStep
            );

            const rowCells: GridCell[] = [];

            for (let col = 0; col < cols; col++) {
                const lng =
                    CHANDIGARH_BOUNDARY.minLng + col * lngStep;

                const pollutionValue = estimatePollution(
                    lat,
                    lng,
                    stations
                );

                rowCells.push({
                    lat,
                    lng,
                    value: pollutionValue,
                });
            }

            cells.push(rowCells);
        }

        const gridData: GridData = {
            cells,
            latStep,
            lngStep: GRID_RESOLUTION_METERS / METERS_PER_DEGREE_LAT, // approx
            rows: cells.length,
            cols: cells[0].length,
        };

        await redis.set(GRID_KEY, gridData);
        await redis.set(GRID_TIMESTAMP_KEY, Date.now());
        await redis.set(GRID_STATUS_KEY, "fresh");

        return {
            cellCount: rows * cells[0].length,
            status: "fresh",
        };

    } catch (error: any) {
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

export async function getPollutionGrid(): Promise<GridData> {
    const grid = await redis.get<GridData>(GRID_KEY);

    if (!grid) {
        throw new Error("Pollution grid not initialized");
    }

    return grid;
}

function distanceSquared(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
) {
    const dLat = lat1 - lat2;
    const dLng = lng1 - lng2;
    return dLat * dLat + dLng * dLng;
}

export function getGridValueAt(
    lat: number,
    lng: number,
    grid: GridData
): number {
    const { cells, latStep, rows, cols } = grid;

    const row = Math.floor(
        (lat - CHANDIGARH_BOUNDARY.minLat) / latStep
    );

    if (row < 0 || row >= rows) {
        return 0;
    }

    const lngStep = metersToLngDegrees(
        GRID_RESOLUTION_METERS,
        lat
    );

    const col = Math.floor(
        (lng - CHANDIGARH_BOUNDARY.minLng) / lngStep
    );

    if (col < 0 || col >= cols) {
        return 0;
    }

    return cells[row][col].value;
}

