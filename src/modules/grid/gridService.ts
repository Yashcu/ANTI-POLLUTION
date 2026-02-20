import { redis } from "@/infrastructure/redis";
import { GridData } from "@/modules/grid/types";
import { AppError } from "@/shared/errors/AppError";
import { logError, logInfo, logWarn } from "@/infrastructure/logger";
import { computePollutionGrid } from "./gridBuilder";
import { validateGridData } from "./gridValidator";
export { getGridValueAt } from "./gridCalculator";

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

export async function buildPollutionGrid() {
    try {
        const { gridData, quality, cellCount } = await computePollutionGrid();

        // Convert Float32Array to Node Buffer, then to Base64 String
        const base64Data = Buffer.from(gridData.data.buffer).toString('base64');

        const payload = {
            data: base64Data,
            latStep: gridData.latStep,
            lngStep: gridData.lngStep,
            rows: gridData.rows,
            cols: gridData.cols
        };

        const startSet = Date.now();
        await redis.set(GRID_KEY, payload);
        await redis.set(GRID_META_KEY, {
            builtAt: Date.now(),
            sensorQuality: quality,
        });
        logInfo("redis_grid_write", { latency_ms: Date.now() - startSet });

        logInfo("grid_rebuild_success", { quality, cells: cellCount });

        inMemoryGrid = null;

        return {
            cellCount,
            status: quality,
            grid: gridData
        };

    } catch (error) {
        logError("grid_build_failed", { error: error instanceof Error ? error.message : error });

        const existingGrid = await redis.exists(GRID_KEY);

        if (existingGrid) {
            return {
                status: "degraded",
                usedFallback: true,
                grid: null
            };
        }

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
    if (!shouldTriggerRebuild()) return;

    lastRebuildAttempt = Date.now();

    const lock = await redis.set(GRID_REBUILD_LOCK, "1", {
        nx: true,
        ex: 300,
    });

    if (!lock) return;

    buildPollutionGrid()
        .catch((err) => {
            logError("grid_rebuild_failed", { error: err instanceof Error ? err.message : err });
        })
        .finally(() => {
            redis.del(GRID_REBUILD_LOCK);
        });
}

export async function getPollutionGrid() {
    // 1. Check in-memory cache
    if (inMemoryGrid && Date.now() - inMemoryGrid.cachedAt < MEMORY_TTL_MS) {
        const ageMinutes = (Date.now() - inMemoryGrid.meta.builtAt) / 60000;
        return {
            grid: inMemoryGrid.grid,
            status: ageMinutes > 90 ? "stale" : ageMinutes > 60 || inMemoryGrid.meta.sensorQuality === 'degraded' ? "aging" : "fresh",
            ageMinutes,
        };
    }

    // 2. Fetch from Redis
    const startRedis = Date.now();
    const [rawGrid, rawMeta] = await redis.mget<[unknown, unknown]>(
        GRID_KEY,
        GRID_META_KEY
    );
    logInfo("redis_mget_grid", { latency_ms: Date.now() - startRedis });

    if (!rawGrid || !rawMeta) {
        if (shouldTriggerRebuild()) {
            triggerBackgroundRebuild();
        }
        throw new AppError("Pollution grid initializing. Please retry in a moment.", 503, "GRID_INITIALIZING");
    }

    // 3. Validation
    const { grid: validPayload, meta } = validateGridData(rawGrid, rawMeta);

    // 4. Reconstruct Float32Array from Base64
    const buffer = Buffer.from(validPayload.data, 'base64');
    const floatArray = new Float32Array(
        buffer.buffer,
        buffer.byteOffset,
        buffer.length / Float32Array.BYTES_PER_ELEMENT
    );

    const reconstructedGrid: GridData = {
        data: floatArray,
        latStep: validPayload.latStep,
        lngStep: validPayload.lngStep,
        rows: validPayload.rows,
        cols: validPayload.cols,
    };

    // 5. Update Memory Cache
    inMemoryGrid = {
        grid: reconstructedGrid,
        meta: meta as { builtAt: number; sensorQuality: string },
        cachedAt: Date.now(),
    };

    const ageMinutes = (Date.now() - meta.builtAt) / 60000;
    const status = ageMinutes > 90 ? "stale" : ageMinutes > 60 || meta.sensorQuality === 'degraded' ? "aging" : "fresh";

    if (status === "stale") {
        if (shouldTriggerRebuild()) triggerBackgroundRebuild();
        logWarn("using_stale_grid", { age_minutes: ageMinutes });
    }

    logInfo("grid_status", { status, age_minutes: ageMinutes });

    return {
        grid: reconstructedGrid,
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
