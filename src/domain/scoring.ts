import { RiskLevel, RouteGeometry } from "@/shared/types/route";

export interface ScorableRoute {
    distance_km: number;
    duration_min: number;
    pollution_load_index: number;
    average_pollution: number;
    risk_level: RiskLevel;
    route: RouteGeometry;
    path_details: { lat: number; lng: number; aqi: number }[];
}

export interface ScoredRoute extends ScorableRoute {
    pollution_norm: number;
    distance_norm: number;
    composite_score: number;
    is_selected: boolean;
}

const DEFAULT_ALPHA = 0.55;
const DEFAULT_BETA = 0.45;

export function scoreRoutes(
    routes: ScorableRoute[],
    alpha: number = DEFAULT_ALPHA,
    beta: number = DEFAULT_BETA
): ScoredRoute[] {

    if (routes.length === 0) return [];

    const maxDistance = Math.max(...routes.map(r => r.distance_km));
    const minDistance = Math.min(...routes.map(r => r.distance_km));

    const maxPollution = Math.max(...routes.map(r => r.pollution_load_index));
    const minPollution = Math.min(...routes.map(r => r.pollution_load_index));

    const distanceRange = maxDistance - minDistance || 1;
    const pollutionRange = maxPollution - minPollution || 1;

    const scored = routes.map(route => {

        const distanceNorm =
            (route.distance_km - minDistance) / distanceRange;

        const pollutionNorm =
            (route.pollution_load_index - minPollution) / pollutionRange;

        const composite =
            alpha * pollutionNorm +
            beta * distanceNorm;

        return {
            ...route,
            pollution_norm: Number(pollutionNorm.toFixed(4)),
            distance_norm: Number(distanceNorm.toFixed(4)),
            composite_score: Number(composite.toFixed(4)),
            is_selected: false
        };
    });

    const best = scored.reduce((prev, curr) =>
        curr.composite_score < prev.composite_score ? curr : prev
    );

    return scored.map(route => ({
        ...route,
        is_selected: route === best
    }));
}
