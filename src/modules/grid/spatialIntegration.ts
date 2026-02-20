import { GRID_RESOLUTION_METERS } from "@/domain/city";

// Adaptive sampling: We sample at half the grid resolution to ensure we don't 
// miss grid transitions, but without wasting CPU cycles on microscopic steps.
export const INTEGRATION_RESOLUTION_METERS = Math.max(50, GRID_RESOLUTION_METERS / 2);

type LatLng = [number, number];

export function interpolate(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
    fraction: number
): LatLng {
    return [
        lat1 + (lat2 - lat1) * fraction,
        lng1 + (lng2 - lng1) * fraction,
    ];
}
