import { z } from "zod";
import { AppError } from "@/shared/errors/AppError";
import { logError } from "@/infrastructure/logger";

const gridCellSchema = z.object({
    lat: z.number(),
    lng: z.number(),
    value: z.number(),
});

export const gridDataSchema = z.object({
    cells: z.array(z.array(gridCellSchema)),
    latStep: z.number(),
    lngStep: z.number(),
    rows: z.number(),
    cols: z.number(),
});

export const metaSchema = z.object({
    builtAt: z.number(),
    sensorQuality: z.string(),
});

export function validateGridData(rawGrid: unknown, rawMeta: unknown) {
    const gridParse = gridDataSchema.safeParse(rawGrid);
    const metaParse = metaSchema.safeParse(rawMeta);

    if (!gridParse.success || !metaParse.success) {
        logError("grid_corrupted_redis", {
            gridError: !gridParse.success ? gridParse.error : null,
            metaError: !metaParse.success ? metaParse.error : null
        });

        throw new AppError(
            "Pollution grid corrupted",
            503,
            "GRID_CORRUPTED"
        );
    }

    return {
        grid: gridParse.data,
        meta: metaParse.data
    };
}
