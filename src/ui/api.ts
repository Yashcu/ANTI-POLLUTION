import { CachedRoutePayload } from "@/modules/routing/types";

interface GeocodeResponse {
    lat: number;
    lng: number;
    label?: string;
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
): Promise<CachedRoutePayload> {
    return postJSON<CachedRoutePayload>("/api/route", {
        origin,
        destination,
    });
}