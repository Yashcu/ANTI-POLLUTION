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

let inMemoryGrid: GridData | null = null;

// Convert meters → longitude degrees (varies by latitude)
function metersToLngDegrees(meters: number, lat: number): number {
    const metersPerDegreeLng =
        111000 * Math.cos((lat * Math.PI) / 180);

    return meters / metersPerDegreeLng;
}

export async function buildPollutionGrid() {
    try {
        const { stations, quality } = await getChandigarhStations();

        if (stations.length === 0) {
            throw new Error("No usable stations for grid build");
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
        inMemoryGrid = gridData;
        await redis.set(GRID_TIMESTAMP_KEY, Date.now());
        await redis.set(GRID_STATUS_KEY, quality);

        return {
            cellCount: rows * cells[0].length,
            status: quality,
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
    const sensorQuality = await redis.get<string>(GRID_STATUS_KEY);

    if (!timestamp) {
        return { status: "stale", ageMinutes: null };
    }

    const ageMs = Date.now() - timestamp;
    const ageMinutes = ageMs / (1000 * 60);

    if (ageMinutes > 90) {
        return { status: "stale", ageMinutes };
    }

    if (ageMinutes > 60 || sensorQuality === "degraded") {
        return { status: "degraded", ageMinutes };
    }

    return { status: "fresh", ageMinutes };
}

export async function getPollutionGrid(): Promise<GridData> {

    if (inMemoryGrid) {
        return inMemoryGrid;
    }

    const grid = await redis.get<GridData>(GRID_KEY);

    if (!grid) {
        throw new Error("Pollution grid not initialized");
    }

    inMemoryGrid = grid;

    return grid;
}

export function getGridValueAt(
    lat: number,
    lng: number,
    grid: GridData
): number {
    const { cells, latStep, rows, cols } = grid;

    const rowFloat =
        (lat - CHANDIGARH_BOUNDARY.minLat) / latStep;

    const row = Math.floor(rowFloat);
    const yRatio = rowFloat - row;

    if (row < 0 || row >= rows - 1) {
        return 0;
    }

    const lngStep = metersToLngDegrees(
        GRID_RESOLUTION_METERS,
        lat
    );

    const colFloat =
        (lng - CHANDIGARH_BOUNDARY.minLng) / lngStep;

    const col = Math.floor(colFloat);
    const xRatio = colFloat - col;

    if (col < 0 || col >= cols - 1) {
        return 0;
    }
    const Q11 = cells[row][col].value;
    const Q21 = cells[row][col + 1].value;
    const Q12 = cells[row + 1][col].value;
    const Q22 = cells[row + 1][col + 1].value;

    // Interpolate horizontally
    const top =
        Q11 * (1 - xRatio) + Q21 * xRatio;

    const bottom =
        Q12 * (1 - xRatio) + Q22 * xRatio;

    const interpolated =
        top * (1 - yRatio) + bottom * yRatio;

    return interpolated;

}

