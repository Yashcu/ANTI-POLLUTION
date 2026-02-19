import { getChandigarhStations } from "@/modules/pollution/cpcbClient";
import { estimatePollution } from "@/modules/grid/interpolation";
import { CHANDIGARH_BOUNDARY, GRID_RESOLUTION_METERS } from "@/domain/city";
import { GridCell, GridData } from "@/modules/grid/types";
import { metersToLngDegrees, METERS_PER_DEGREE_LAT } from "./gridCalculator";
import { logInfo } from "@/infrastructure/logger";

export async function computePollutionGrid() {
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

    logInfo("grid_computed", { quality, cells: rows * cells[0].length });

    return {
        gridData,
        quality,
        cellCount: rows * cells[0].length
    };
}
