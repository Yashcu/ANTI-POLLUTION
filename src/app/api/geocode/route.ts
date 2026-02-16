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
            `https://api.openrouteservice.org/geocode/search?api_key=${process.env.ORS_API_KEY}&text=${encodeURIComponent(
                query
            )}&size=1`
        );

        if (!response.ok) {
            return NextResponse.json(
                { error: "Geocoding service unavailable" },
                { status: 502 }
            );
        }

        const data = await response.json();

        if (!data.features || data.features.length === 0) {
            return NextResponse.json(
                { error: "Location not found" },
                { status: 404 }
            );
        }

        const [lng, lat] = data.features[0].geometry.coordinates;

        return NextResponse.json({
            lat,
            lng,
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
