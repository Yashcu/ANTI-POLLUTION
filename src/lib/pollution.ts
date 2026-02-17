import { getPollutionGrid, getGridValueAt } from "./grid";
import { getWayTypeMultiplier } from "./roadWeights";

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const toRad = (deg: number) => deg * (Math.PI / 180);

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export async function calculateRouteExposure(
  coordinates: number[][],
  wayTypeLookup: number[]
): Promise<{ totalExposure: number; averagePollution: number }> {

  const grid = await getPollutionGrid();

  let totalExposure = 0;
  let totalDistance = 0;

  for (let i = 0; i < coordinates.length - 1; i++) {

    const [lng1, lat1] = coordinates[i];
    const [lng2, lat2] = coordinates[i + 1];

    const segmentDistance = haversineDistance(
      lat1,
      lng1,
      lat2,
      lng2
    );

    const pollutionValue = getGridValueAt(
      lat1,
      lng1,
      grid
    );

    const wayType = wayTypeLookup[i] || 0;
    const multiplier = getWayTypeMultiplier(wayType);

    totalExposure += pollutionValue * segmentDistance * multiplier;
    totalDistance += segmentDistance;
  }

  const averagePollution =
    totalDistance > 0 ? totalExposure / totalDistance : 0;

  return {
    totalExposure,
    averagePollution
  };
}
