export type RiskLevel =
    | "Good"
    | "Moderate"
    | "Unhealthy for Sensitive Groups"
    | "Unhealthy"
    | "Very Unhealthy";

export interface RouteGeometry {
    coordinates: [number, number][];
}

export interface RouteModel {
    distance_km: number;
    duration_min: number;
    exposure_score: number;
    average_pollution: number;
    risk_level: RiskLevel;
    route: RouteGeometry;
    composite_score: number;
    is_selected: boolean;
    is_fastest?: boolean;
    savings_tag?: string;
}

export interface GridMeta {
    last_updated: string;
    freshness_minutes: number;
    interpolation: string;
    source: string;
}

