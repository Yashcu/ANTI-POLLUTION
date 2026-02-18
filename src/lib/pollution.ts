import { getPollutionGrid, getGridValueAt } from "./grid";
import { resamplePolyline, INTEGRATION_RESOLUTION_METERS } from "./spatialIntegration";

export async function calculateRouteExposure(
  coordinates: number[][],
): Promise<{ totalExposure: number; averagePollution: number }> {

  const grid = await getPollutionGrid();

  const sampledPoints = resamplePolyline(coordinates);

  let totalExposure = 0;
  let totalDistance = 0;

  for (const [lat, lng] of sampledPoints) {

    const pollutionValue = getGridValueAt(
      lat,
      lng,
      grid
    );

    totalExposure +=
      pollutionValue *
      INTEGRATION_RESOLUTION_METERS;

    totalDistance +=
      INTEGRATION_RESOLUTION_METERS;
  }

  const averagePollution =
    totalDistance > 0 ? totalExposure / totalDistance : 0;

  return {
    totalExposure,
    averagePollution
  };
}
