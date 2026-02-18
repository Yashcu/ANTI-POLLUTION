import { haversineDistance } from "@/domain/geo";

type LatLng = [number, number];

export const INTEGRATION_RESOLUTION_METERS = 50;

function interpolate(
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

export function resamplePolyline(
    coordinates: number[][]
): LatLng[] {
    if (coordinates.length < 2) return [];

    const sampled: LatLng[] = [];

    let accumulated = 0;

    for (let i = 0; i < coordinates.length - 1; i++) {
        const [lng1, lat1] = coordinates[i];
        const [lng2, lat2] = coordinates[i + 1];

        const segmentDistance = haversineDistance(
            lat1,
            lng1,
            lat2,
            lng2
        );

        let segmentStart = 0;

        if (segmentDistance === 0) continue;

        while (
            accumulated + (segmentDistance - segmentStart) >=
            INTEGRATION_RESOLUTION_METERS
        ) {
            const remaining =
                INTEGRATION_RESOLUTION_METERS - accumulated;

            const fraction =
                (segmentStart + remaining) / segmentDistance;

            const point = interpolate(
                lat1,
                lng1,
                lat2,
                lng2,
                fraction
            );

            sampled.push(point);

            segmentStart += remaining;
            accumulated = 0;
        }

        accumulated += segmentDistance - segmentStart;
    }

    return sampled;
}
