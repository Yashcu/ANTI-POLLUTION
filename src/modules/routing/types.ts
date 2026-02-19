import { ScorableRoute, ScoredRoute } from "@/domain/scoring";

export interface RouteRequest {
    origin: [number, number];
    destination: [number, number];
}

export interface RouteServiceResult {
    routes: ScorableRoute[];
    orsLatency: number;
}

export interface GridMeta {
    status: string;
    age_minutes: number | null;
    last_updated: string;
    freshness_minutes: number;
    interpolation: string;
    source: string;
}

export interface CachedRoutePayload {
    routes: ScoredRoute[];
    grid_meta: GridMeta;
    metrics: {
        total_processing_ms: number;
        ors_latency_ms: number;
    };
}