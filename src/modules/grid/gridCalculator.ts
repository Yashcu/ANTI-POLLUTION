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

/**
 * Extracts the top N most polluted grid cells and converts them 
 * into GeoJSON MultiPolygon coordinates for the routing engine to avoid.
 */
export function getDynamicHotspots(grid: GridData, targetCount: number = 20): [number, number][][][] {
    const { data, latStep, lngStep, rows, cols } = grid;

    // 1. Gather all cells with their pollution values
    const cells = [];
    for (let row = 0; row < rows - 1; row++) {
        for (let col = 0; col < cols - 1; col++) {
            const val = data[row * cols + col];
            if (val > 100) { // Only consider Unhealthy/Moderate cells
                cells.push({ row, col, val });
            }
        }
    }

    // 2. Sort descending by pollution intensity
    cells.sort((a, b) => b.val - a.val);

    // 3. Take the worst offenders (ORS has polygon complexity limits, so we cap it)
    const worstCells = cells.slice(0, targetCount);

    // 4. Convert to GeoJSON Polygon format
    const polygons: [number, number][][][] = [];

    for (const cell of worstCells) {
        const minLat = CHANDIGARH_BOUNDARY.minLat + cell.row * latStep;
        const maxLat = minLat + latStep;
        const minLng = CHANDIGARH_BOUNDARY.minLng + cell.col * lngStep;
        const maxLng = minLng + lngStep;

        // A GeoJSON Polygon is an array of LinearRings. 
        // We push the 4 corners of the cell, closing the loop with the first point.
        polygons.push([[
            [minLng, minLat],
            [maxLng, minLat],
            [maxLng, maxLat],
            [minLng, maxLat],
            [minLng, minLat]
        ]]);
    }

    return polygons;
}
