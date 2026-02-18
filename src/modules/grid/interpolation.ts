import { Station } from "@/modules/pollution/types";
import { haversineDistance } from "@/domain/geo";

const POWER = 2;
const MIN_DISTANCE_METERS = 100;
const MAX_INFLUENCE_RADIUS_METERS = 5000;

export function estimatePollution(
    lat: number,
    lng: number,
    stations: Station[]
): number {
    if (stations.length === 0) {
        throw new Error("No stations available for interpolation");
    }

    let numerator = 0;
    let denominator = 0;

    for (const station of stations) {
        const distance = haversineDistance(lat, lng, station.lat, station.lng);

        // If very close to station, return its value directly
        if (distance < MIN_DISTANCE_METERS) {
            return station.value;
        }

        if (distance > MAX_INFLUENCE_RADIUS_METERS) {
            continue;
        }

        const weight = 1 / Math.pow(distance, POWER);

        numerator += weight * station.value;
        denominator += weight;
    }

    if (denominator === 0) {
        return stations.reduce((sum, s) => sum + s.value, 0) / stations.length;
    }

    return numerator / denominator;
}
