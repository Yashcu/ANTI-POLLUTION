import { calculateRouteExposure } from "@/modules/pollution/pollutionService";
import { GridData } from "@/modules/grid/types";
import { classifyAQI } from "@/domain/aqi";
import { fetchWithRetry } from "@/infrastructure/orsClient";
import { ORSRouteResponse } from "@/shared/types/ors";
import { AppError } from "@/shared/errors/AppError";
import { env } from "@/shared/env";
import { RouteRequest, RouteServiceResult } from "@/modules/routing/types";
import { ScorableRoute } from "@/domain/scoring";
import { getDynamicHotspots } from "@/modules/grid/gridCalculator";
import { logInfo, logWarn } from "@/infrastructure/logger";

export async function evaluateRoutes(
    input: RouteRequest & { grid: GridData }
): Promise<RouteServiceResult> {

    const { origin, destination, grid } = input;
    const orsStart = Date.now();

    // ─── 1. FETCH STANDARD (FASTEST) ROUTE ────────────────────────────
    const standardBody = {
        coordinates: [
            [origin[1], origin[0]],
            [destination[1], destination[0]],
        ],
        alternative_routes: { target_count: 2, share_factor: 0.6 },
    };

    const standardRes = await fetchWithRetry(
        "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
        {
            method: "POST",
            headers: { Authorization: env.ORS_API_KEY, "Content-Type": "application/json" },
            body: JSON.stringify(standardBody)
        }
    );

    if (!standardRes.ok) {
        throw new AppError("Routing service temporarily unavailable", 502, "ORS_UPSTREAM_ERROR");
    }
    const standardData: ORSRouteResponse = await standardRes.json();

    // ─── 2. FETCH CLEAN ROUTE (AVOIDING RED ZONES) ───────────────────
    // Extract the top 20 worst grid cells to route around
    const hotspots = getDynamicHotspots(grid, 20);
    let cleanData: ORSRouteResponse | null = null;

    if (hotspots.length > 0) {
        const cleanBody = {
            coordinates: [
                [origin[1], origin[0]],
                [destination[1], destination[0]],
            ],
            options: {
                avoid_polygons: {
                    type: "MultiPolygon",
                    coordinates: hotspots
                }
            }
        };

        try {
            const cleanRes = await fetchWithRetry(
                "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
                {
                    method: "POST",
                    headers: { Authorization: env.ORS_API_KEY, "Content-Type": "application/json" },
                    body: JSON.stringify(cleanBody)
                }
            );

            if (cleanRes.ok) {
                cleanData = await cleanRes.json();
                logInfo("ors_clean_route_success", { hotspots_avoided: hotspots.length });
            }
        } catch (error) {
            // If the avoidance geometry is too complex and ORS fails, we just silently 
            // fallback to the standard routes so the user isn't blocked.
            logWarn("ors_clean_route_failed_fallback", { error });
        }
    }

    const orsLatency = Date.now() - orsStart;

    // ─── 3. COMBINE & DEDUPLICATE RESULTS ────────────────────────────
    const allFeatures = [...(standardData.features || [])];
    if (cleanData?.features) {
        allFeatures.push(...cleanData.features);
    }

    if (allFeatures.length === 0) {
        throw new AppError("No routes found between these locations", 404, "NO_ROUTES_FOUND");
    }

    const results: ScorableRoute[] = [];
    const seenGeometries = new Set<string>();

    for (const feature of allFeatures) {
        // Deduplicate routes based on distance to avoid evaluating identical paths
        // (Often the "clean" route might just be the "fastest" route if air is good)
        const distanceKm = feature.properties.summary.distance / 1000;
        const distanceKey = distanceKm.toFixed(3);

        if (seenGeometries.has(distanceKey)) continue;
        seenGeometries.add(distanceKey);

        const durationMin = feature.properties.summary.duration / 60;
        const geometryCoords = feature.geometry.coordinates;

        // Calculate exposure using the Day 1 flat buffer math
        const { totalExposure, averagePollution, pathDetails } =
            calculateRouteExposure(geometryCoords, grid);

        results.push({
            distance_km: Number(distanceKm.toFixed(2)),
            duration_min: Number(durationMin.toFixed(2)),
            pollution_load_index: Number(totalExposure.toFixed(2)),
            average_pollution: Number(averagePollution.toFixed(2)),
            risk_level: classifyAQI(averagePollution),
            route: feature.geometry,
            path_details: pathDetails,
        });
    }

    return {
        routes: results,
        orsLatency,
    };
}
