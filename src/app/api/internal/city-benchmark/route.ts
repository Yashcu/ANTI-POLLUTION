import { NextResponse } from "next/server";
import { randomPointInChandigarh } from "@/lib/city";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!;

export async function GET() {
    try {
        const TOTAL = 50; // keep 50 for MVP, increase later

        const results: number[] = [];
        const extraDistances: number[] = [];
        let divergenceCount = 0;

        for (let i = 0; i < TOTAL; i++) {
            const origin = randomPointInChandigarh();
            const destination = randomPointInChandigarh();

            const response = await fetch(
                `${BASE_URL}/api/route`,
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

            const selected = data.routes.find(
                (r: any) => r.is_selected
            );

            if (!selected) continue;

            const pollutionSaved =
                fastest.exposure_score -
                selected.exposure_score;

            const percentageSaved =
                fastest.exposure_score > 0
                    ? (pollutionSaved /
                        fastest.exposure_score) *
                    100
                    : 0;

            if (pollutionSaved > 0) {
                divergenceCount++;
                results.push(percentageSaved);

                const extraDistancePercent =
                    ((selected.distance_km -
                        fastest.distance_km) /
                        fastest.distance_km) *
                    100;

                extraDistances.push(extraDistancePercent);
            }
        }

        const avg = (arr: number[]) =>
            arr.length === 0
                ? 0
                : arr.reduce((a, b) => a + b, 0) /
                arr.length;

        const median = (arr: number[]) => {
            if (arr.length === 0) return 0;
            const sorted = [...arr].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            return sorted[mid];
        };

        return NextResponse.json({
            total_routes: TOTAL,
            divergence_rate:
                (divergenceCount / TOTAL) * 100,
            avg_percentage_saved: avg(results),
            median_percentage_saved:
                median(results),
            max_percentage_saved:
                results.length > 0
                    ? Math.max(...results)
                    : 0,
            avg_extra_distance_percent:
                avg(extraDistances),
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
