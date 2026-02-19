import { GridData } from "@/modules/grid/types";
import { CHANDIGARH_BOUNDARY, GRID_RESOLUTION_METERS } from "@/domain/city";

export const METERS_PER_DEGREE_LAT = 111000;

export function metersToLngDegrees(meters: number, lat: number): number {
    const metersPerDegreeLng =
        111000 * Math.cos((lat * Math.PI) / 180);

    return meters / metersPerDegreeLng;
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
