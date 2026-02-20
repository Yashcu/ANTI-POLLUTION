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
    pollution_load_index: number;
    pollution_norm?: number;
    distance_norm?: number;
    average_pollution: number;
    risk_level: RiskLevel;
    route: RouteGeometry;
    composite_score: number;
    is_selected: boolean;
    is_fastest?: boolean;
    savings_tag?: string;
    path_details: { lat: number; lng: number; aqi: number }[];
}