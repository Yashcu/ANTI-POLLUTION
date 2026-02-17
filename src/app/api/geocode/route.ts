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

        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                query
            )}&limit=5`,
            {
                headers: {
                    "User-Agent": "EcoRouteApp/1.0 (your@email.com)",
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
                { error: "Location not found" },
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
