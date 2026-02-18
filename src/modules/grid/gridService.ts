import { getChandigarhStations } from "@/modules/pollution/cpcbClient";
import { estimatePollution } from "@/modules/grid/interpolation";
import { CHANDIGARH_BOUNDARY, GRID_RESOLUTION_METERS } from "@/domain/city";
import { redis } from "@/infrastructure/redis";
import { GridCell, GridData } from "@/modules/grid/types";

import { AppError } from "@/shared/errors/AppError";
import { logError, logInfo, logWarn } from "@/infrastructure/logger";

const GRID_KEY = "pollution:grid:data";
const GRID_META_KEY = "pollution:grid:meta";
const GRID_REBUILD_LOCK = "pollution:grid:rebuild:lock";

const MEMORY_TTL_MS = 60_000;
let inMemoryGrid: {
    grid: GridData;
    meta: { builtAt: number; sensorQuality: string };
    cachedAt: number;
} | null = null;

let lastRebuildAttempt = 0;

function shouldTriggerRebuild() {
    return Date.now() - lastRebuildAttempt > 30_000;
}

const METERS_PER_DEGREE_LAT = 111000;

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

        const startSet = Date.now();
        await redis.set(GRID_KEY, gridData);
        await redis.set(GRID_META_KEY, {
            builtAt: Date.now(),
            sensorQuality: quality,
        });
        logInfo("redis_grid_write", { latency_ms: Date.now() - startSet });

        logInfo("grid_rebuild_success", { quality, cells: rows * cells[0].length });

        return {
            cellCount: rows * cells[0].length,
            status: quality,
        };

    } catch (error) {
        logError("grid_build_failed", { error: error instanceof Error ? error.message : error });

        // Fallback: Check if we have an existing grid
        const existingGrid = await redis.exists(GRID_KEY);

        if (existingGrid) {
            // Keep existing grid, just maybe update meta to show we tried but failed? 
            // Actually, keep old meta so we track real age. 
            // Just return "degraded" status to caller but don't blow up data.
            return {
                status: "degraded", // Caller knows it failed
                usedFallback: true
            };
        }

        // Only if NO grid exists do we write the "degraded" meta placeholder
        await redis.set(GRID_META_KEY, {
            builtAt: Date.now(),
            sensorQuality: "degraded",
        });

        throw new AppError(
            "Grid build failed and no fallback available.",
            503,
            "GRID_BUILD_FAILED_NO_FALLBACK"
        );
    }
}


export async function getGridStatus() {
    const meta = await redis.get<{ builtAt: number; sensorQuality: string }>(GRID_META_KEY);

    if (!meta) {
        return { status: "stale", ageMinutes: null };
    }

    const ageMs = Date.now() - meta.builtAt;
    const ageMinutes = ageMs / (1000 * 60);

    if (ageMinutes > 90) {
        return { status: "stale", ageMinutes };
    }

    if (ageMinutes > 60 || meta.sensorQuality === "degraded") {
        return { status: "degraded", ageMinutes };
    }

    return { status: "fresh", ageMinutes };
}

async function triggerBackgroundRebuild() {
    // Double check throttle before actually acquiring lock
    if (!shouldTriggerRebuild()) return;

    lastRebuildAttempt = Date.now();

    const lock = await redis.set(GRID_REBUILD_LOCK, "1", {
        nx: true,
        ex: 300, // 5 min lock
    });

    if (!lock) {
        return; // rebuild already running
    }

    buildPollutionGrid()
        .catch((err) => {
            logError("grid_rebuild_failed", { error: err instanceof Error ? err.message : err });
        })
        .finally(() => {
            redis.del(GRID_REBUILD_LOCK);
        });
}

export async function getPollutionGrid() {
    // 1. Check in-memory cache (Fastest)
    if (inMemoryGrid && Date.now() - inMemoryGrid.cachedAt < MEMORY_TTL_MS) {
        const ageMinutes = (Date.now() - inMemoryGrid.meta.builtAt) / 60000;
        return {
            grid: inMemoryGrid.grid,
            status:
                ageMinutes > 90 ? "stale" :
                    ageMinutes > 60 || inMemoryGrid.meta.sensorQuality === 'degraded' ? "aging" :
                        "fresh",
            ageMinutes,
        };
    }

    // 2. Fetch from Redis (Optimized with mget)
    const startRedis = Date.now();
    const [grid, meta] = await redis.mget<[GridData, { builtAt: number; sensorQuality: string }]>(
        GRID_KEY,
        GRID_META_KEY
    );
    logInfo("redis_mget_grid", { latency_ms: Date.now() - startRedis });

    if (!grid || !meta) {
        // Trigger lazy build if grid is missing entirely
        if (shouldTriggerRebuild()) {
            triggerBackgroundRebuild();
        }

        throw new AppError(
            "Pollution grid initializing. Please retry in a moment.",
            503,
            "GRID_INITIALIZING"
        );
    }

    // 3. Update Memory Cache
    inMemoryGrid = {
        grid,
        meta,
        cachedAt: Date.now(),
    };

    const ageMinutes = (Date.now() - meta.builtAt) / 60000;

    const status =
        ageMinutes > 90 ? "stale" :
            ageMinutes > 60 || meta.sensorQuality === 'degraded' ? "aging" :
                "fresh";

    // Self-heal: trigger background rebuild if grid is stale
    if (status === "stale") {
        if (shouldTriggerRebuild()) triggerBackgroundRebuild();
        logWarn("using_stale_grid", { age_minutes: ageMinutes });
    }

    logInfo("grid_status", { status, age_minutes: ageMinutes });

    return {
        grid,
        status,
        ageMinutes,
    };
}

export async function getGridHealth() {
    const gridExists = await redis.exists(GRID_KEY);
    const meta = await redis.get<{ builtAt: number }>(GRID_META_KEY);

    return {
        status: gridExists ? "healthy" : "grid_missing",
        grid_age_minutes: meta
            ? (Date.now() - meta.builtAt) / 60000
            : null,
    };
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

