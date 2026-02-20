import { getChandigarhStations } from "@/modules/pollution/cpcbClient";
import { estimatePollution } from "@/modules/grid/interpolation";
import { CHANDIGARH_BOUNDARY, GRID_RESOLUTION_METERS } from "@/domain/city";
import { GridData } from "@/modules/grid/types";
import { metersToLngDegrees, METERS_PER_DEGREE_LAT } from "./gridCalculator";
import { logInfo } from "@/infrastructure/logger";

export async function computePollutionGrid() {
    const { stations, quality } = await getChandigarhStations();

    if (stations.length === 0) {
        throw new Error("No usable stations for grid build");
    }

    const latStep = GRID_RESOLUTION_METERS / METERS_PER_DEGREE_LAT;

    // Calculate lngStep once based on the city's center latitude for a uniform matrix
    const centerLat = (CHANDIGARH_BOUNDARY.minLat + CHANDIGARH_BOUNDARY.maxLat) / 2;
    const lngStep = metersToLngDegrees(GRID_RESOLUTION_METERS, centerLat);

    const rows = Math.ceil((CHANDIGARH_BOUNDARY.maxLat - CHANDIGARH_BOUNDARY.minLat) / latStep);
    const cols = Math.ceil((CHANDIGARH_BOUNDARY.maxLng - CHANDIGARH_BOUNDARY.minLng) / lngStep);
    const totalCells = rows * cols;

    // Allocate a flat binary buffer
    const buffer = new Float32Array(totalCells);

    for (let row = 0; row < rows; row++) {
        const lat = CHANDIGARH_BOUNDARY.minLat + row * latStep;
        for (let col = 0; col < cols; col++) {
            const lng = CHANDIGARH_BOUNDARY.minLng + col * lngStep;

            const pollutionValue = estimatePollution(lat, lng, stations);

            // Map 2D coordinates to a 1D index
            buffer[row * cols + col] = pollutionValue;
        }
    }

    const gridData: GridData = {
        data: buffer,
        latStep,
        lngStep,
        rows,
        cols,
    };

    logInfo("grid_computed", { quality, cells: totalCells });

    return {
        gridData,
        quality,
        cellCount: totalCells
    };
}
