export interface ORSRouteSummary {
    distance: number;   // meters
    duration: number;   // seconds
}

export interface ORSRouteProperties {
    summary: ORSRouteSummary;
}

export interface ORSRouteGeometry {
    type: "LineString";
    coordinates: [number, number][];
}

export interface ORSRouteFeature {
    geometry: ORSRouteGeometry;
    properties: ORSRouteProperties;
}

export interface ORSRouteResponse {
    features: ORSRouteFeature[];
}
