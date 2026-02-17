import { NextResponse } from "next/server";
import { calculateRouteExposure } from "@/lib/pollution";
import { sampleRoutePoints } from "@/lib/sampling";

export async function POST(req: Request) {
    try {
        const { routes } = await req.json();

        if (!Array.isArray(routes)) {
            return NextResponse.json(
                { error: "routes array required" },
                { status: 400 }
            );
        }

        const results = [];

        for (const pair of routes) {
            const { origin, destination } = pair;

            // Call your existing route API internally
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BASE_URL}/api/route`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ origin, destination }),
                }
            );

            const data = await response.json();

            if (!data.routes) continue;

            const fastest = data.routes.reduce((prev: any, curr: any) =>
                curr.distance_km < prev.distance_km ? curr : prev
            );

            const selected = data.routes.find((r: any) => r.is_selected);

            const pollutionSaved =
                fastest.exposure_score - selected.exposure_score;

            const percentageSaved =
                fastest.exposure_score > 0
                    ? (pollutionSaved / fastest.exposure_score) * 100
                    : 0;

            results.push({
                origin,
                destination,
                fastest_exposure: fastest.exposure_score,
                selected_exposure: selected.exposure_score,
                pollution_saved: pollutionSaved,
                percentage_saved: Number(percentageSaved.toFixed(2)),
            });
        }

        return NextResponse.json({ results });

    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
