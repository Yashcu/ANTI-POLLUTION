import { getGridValueAt } from "@/modules/grid/gridService";
import { GridData } from "@/modules/grid/types";
import { INTEGRATION_RESOLUTION_METERS, interpolate } from "@/modules/grid/spatialIntegration";
import { haversineDistance } from "@/domain/geo";

export interface RoutePointDetail {
  lat: number;
  lng: number;
  aqi: number;
}

export function calculateRouteExposure(
  coordinates: number[][],
  grid: GridData
): { totalExposure: number; averagePollution: number; pathDetails: RoutePointDetail[] } {

  let totalExposure = 0;
  let totalDistance = 0;

  const pathDetails: RoutePointDetail[] = [];

  if (coordinates.length === 0) {
    return { totalExposure: 0, averagePollution: 0, pathDetails: [] };
  }

  for (let i = 0; i < coordinates.length - 1; i++) {
    // Note: ORS coordinates come as [lng, lat]
    const [lng1, lat1] = coordinates[i];
    const [lng2, lat2] = coordinates[i + 1];

    // Push the start point of the segment to pathDetails for the UI
    if (i === 0) {
      const aqi1 = getGridValueAt(lat1, lng1, grid);
      pathDetails.push({ lat: lat1, lng: lng1, aqi: Math.round(aqi1) });
    }

    const segmentDistance = haversineDistance(lat1, lng1, lat2, lng2);

    if (segmentDistance > 0) {
      // Smart Sampling: If the segment is smaller than our resolution, 
      // treat it as a single chunk using the midpoint's AQI. O(1) calculation.
      if (segmentDistance <= INTEGRATION_RESOLUTION_METERS) {
        const [midLat, midLng] = interpolate(lat1, lng1, lat2, lng2, 0.5);
        const aqi = getGridValueAt(midLat, midLng, grid);

        totalExposure += aqi * segmentDistance;
        totalDistance += segmentDistance;
      } else {
        // For longer segments, break it into adaptive chunks
        const chunks = Math.ceil(segmentDistance / INTEGRATION_RESOLUTION_METERS);
        const chunkDistance = segmentDistance / chunks;

        for (let j = 1; j <= chunks; j++) {
          // Get the midpoint of this specific chunk
          const fraction = (j - 0.5) / chunks;
          const [sampleLat, sampleLng] = interpolate(lat1, lng1, lat2, lng2, fraction);

          const aqi = getGridValueAt(sampleLat, sampleLng, grid);
          totalExposure += aqi * chunkDistance;
          totalDistance += chunkDistance;
        }
      }
    }

    // Push the end point of the segment
    const aqi2 = getGridValueAt(lat2, lng2, grid);
    pathDetails.push({ lat: lat2, lng: lng2, aqi: Math.round(aqi2) });
  }

  const averagePollution = totalDistance > 0 ? totalExposure / totalDistance : 0;

  return {
    totalExposure,
    averagePollution,
    pathDetails,
  };
}
