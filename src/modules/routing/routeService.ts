import { calculateRouteExposure } from "@/modules/pollution/pollutionService";
import { GridData } from "@/modules/grid/types";
import { classifyAQI } from "@/domain/aqi";
import { fetchWithRetry } from "@/infrastructure/orsClient";
import { ORSRouteResponse } from "@/shared/types/ors";
import { AppError } from "@/shared/errors/AppError";
import { env } from "@/shared/env";
import { RouteRequest, RouteServiceResult } from "@/modules/routing/types";

export async function evaluateRoutes(
    input: RouteRequest & { grid: GridData }
): Promise<RouteServiceResult> {

    const { origin, destination, grid } = input;

    const orsStart = Date.now();

    let orsResponse: Response;

    try {
        orsResponse = await fetchWithRetry(
            "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
            {
                method: "POST",
                headers: {
                    Authorization: env.ORS_API_KEY,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    coordinates: [
                        [origin[1], origin[0]],
                        [destination[1], destination[0]],
                    ],
                    alternative_routes: {
                        target_count: 2,
                        share_factor: 0.6,
                    },
                }),
            },
            2,
            4000
        );
    } catch (error) {
        throw new AppError(
            "Routing service temporarily unavailable",
            503,
            "ORS_UNAVAILABLE"
        );
    }

    if (!orsResponse.ok) {
        throw new AppError(
            "Routing service temporarily unavailable",
            502,
            "ORS_UPSTREAM_ERROR"
        );
    }

    const orsLatency = Date.now() - orsStart;
    const data: ORSRouteResponse = await orsResponse.json();

    if (!data.features || data.features.length === 0) {
        throw new AppError(
            "No routes found between these locations",
            404,
            "NO_ROUTES_FOUND"
        );
    }

    const routes = data.features;

    const results: any[] = [];

    for (const feature of routes) {
        const distanceKm = feature.properties.summary.distance / 1000;
        const durationMin = feature.properties.summary.duration / 60;

        const geometryCoords = feature.geometry.coordinates;

        // Synchronous calculation now
        const { totalExposure, averagePollution } =
            calculateRouteExposure(geometryCoords, grid);

        results.push({
            distance_km: Number(distanceKm.toFixed(2)),
            duration_min: Number(durationMin.toFixed(2)),
            pollution_load_index: Number(totalExposure.toFixed(2)),
            average_pollution: Number(averagePollution.toFixed(2)),
            risk_level: classifyAQI(averagePollution),
            route: feature.geometry,
        });
    }

    return {
        routes: results,
        orsLatency,
    };
}
