import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { query } = await req.json();

        if (!query || typeof query !== "string") {
            return NextResponse.json(
                { error: "Location query required" },
                { status: 400 }
            );
        }
        const structuredQuery = `${query}, Chandigarh, India`;

        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                structuredQuery
            )}&limit=5&countrycodes=in&viewbox=76.75,30.78,76.85,30.65&bounded=1`,
            {
                headers: {
                    "User-Agent": "EcoRouteApp/1.0 (your@gmail.com)",
                },
            }
        );

        if (!response.ok) {
            return NextResponse.json(
                { error: "Geocoding service unavailable" },
                { status: 502 }
            );
        }

        const data = await response.json();

        if (!data || data.length === 0) {
            return NextResponse.json(
                { error: "Location not found within Chandigarh city limits" },
                { status: 404 }
            );
        }

        // Take first best match
        const bestMatch = data[0];

        return NextResponse.json({
            lat: parseFloat(bestMatch.lat),
            lng: parseFloat(bestMatch.lon),
            label: bestMatch.display_name,
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
