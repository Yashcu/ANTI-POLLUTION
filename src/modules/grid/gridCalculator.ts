import { GridData } from "@/modules/grid/types";
import { CHANDIGARH_BOUNDARY } from "@/domain/city";

export const METERS_PER_DEGREE_LAT = 111000;

export function metersToLngDegrees(meters: number, lat: number): number {
    const metersPerDegreeLng = 111000 * Math.cos((lat * Math.PI) / 180);
    return meters / metersPerDegreeLng;
}

export function getGridValueAt(
    lat: number,
    lng: number,
    grid: GridData
): number {
    const { data, latStep, lngStep, rows, cols } = grid;

    const rowFloat = (lat - CHANDIGARH_BOUNDARY.minLat) / latStep;
    const colFloat = (lng - CHANDIGARH_BOUNDARY.minLng) / lngStep;

    const row = Math.floor(rowFloat);
    const col = Math.floor(colFloat);

    // Bounds check
    if (row < 0 || row >= rows - 1 || col < 0 || col >= cols - 1) {
        return 0;
    }

    const yRatio = rowFloat - row;
    const xRatio = colFloat - col;

    // Helper to find 1D index
    const idx = (r: number, c: number) => r * cols + c;

    const Q11 = data[idx(row, col)];
    const Q21 = data[idx(row, col + 1)];
    const Q12 = data[idx(row + 1, col)];
    const Q22 = data[idx(row + 1, col + 1)];

    // Interpolate horizontally
    const top = Q11 * (1 - xRatio) + Q21 * xRatio;
    const bottom = Q12 * (1 - xRatio) + Q22 * xRatio;

    // Interpolate vertically
    return top * (1 - yRatio) + bottom * yRatio;
}
