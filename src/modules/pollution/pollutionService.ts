import { getGridValueAt } from "@/modules/grid/gridService";
import { GridData } from "@/modules/grid/types";
import { resamplePolyline, INTEGRATION_RESOLUTION_METERS } from "@/modules/grid/spatialIntegration";

export function calculateRouteExposure(
  coordinates: number[][],
  grid: GridData
): { totalExposure: number; averagePollution: number } {

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
