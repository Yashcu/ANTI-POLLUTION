import { RouteModel } from "@/types/route";

interface GeocodeResponse {
    lat: number;
    lng: number;
    label?: string;
}

interface GridMeta {
    last_updated: string;
    freshness_minutes: number;
    interpolation: string;
    source: string;
}

interface RouteResponse {
    routes: RouteModel[];
    grid_meta: GridMeta;
}

async function postJSON<T>(url: string, body: unknown): Promise<T> {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || "Request failed");
    }

    return data;
}

export async function geocode(query: string): Promise<GeocodeResponse> {
    return postJSON<GeocodeResponse>("/api/geocode", { query });
}

export async function fetchRoutes(
    origin: [number, number],
    destination: [number, number]
): Promise<RouteResponse> {
    return postJSON<RouteResponse>("/api/route", {
        origin,
        destination,
    });
}