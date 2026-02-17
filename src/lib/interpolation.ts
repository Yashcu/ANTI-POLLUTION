import { Station } from "./cpcb";

const POWER = 2;
const MIN_DISTANCE_METERS = 100;

function toRadians(deg: number) {
    return deg * (Math.PI / 180);
}

function haversineDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const R = 6371000; // meters

    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

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

        const weight = 1 / Math.pow(distance, POWER);

        numerator += weight * station.value;
        denominator += weight;
    }

    if (denominator === 0) {
        return stations.reduce((sum, s) => sum + s.value, 0) / stations.length;
    }

    return numerator / denominator;
}
