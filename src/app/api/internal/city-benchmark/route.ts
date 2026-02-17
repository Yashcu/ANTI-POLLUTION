import { NextResponse } from "next/server";
import { randomPointInChandigarh } from "@/lib/city";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!;

export async function GET() {
    try {

        const TOTAL = 50;
        const BATCH_SIZE = 3;
        const DELAY_MS = 700;

        let divergenceCount = 0;
        let failureCount = 0;

        const results: number[] = [];
        const extraDistances: number[] = [];

        function sleep(ms: number) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        for (let i = 0; i < TOTAL; i += BATCH_SIZE) {
            const batchPromises = [];

            for (let j = 0; j < BATCH_SIZE && i + j < TOTAL; j++) {
                const origin = randomPointInChandigarh();
                const destination = randomPointInChandigarh();

                batchPromises.push(
                    fetch(`${BASE_URL}/api/route`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ origin, destination }),
                    })
                        .then(async res => {
                            if (!res.ok) {
                                failureCount++;
                                return null;
                            }
                            return res.json();
                        })
                        .catch(() => {
                            failureCount++;
                            return null;
                        })
                );
            }

            const batchResults = await Promise.all(batchPromises);

            for (const data of batchResults) {
                if (!data || !data.routes) continue;

                const fastest = data.routes.reduce((prev: any, curr: any) =>
                    curr.distance_km < prev.distance_km ? curr : prev
                );

                const selected = data.routes.find((r: any) => r.is_selected);
                if (!selected) continue;

                const pollutionSaved =
                    fastest.exposure_score - selected.exposure_score;

                if (pollutionSaved > 0) {
                    divergenceCount++;

                    const percentageSaved =
                        (pollutionSaved / fastest.exposure_score) * 100;

                    results.push(percentageSaved);

                    const extraDistancePercent =
                        ((selected.distance_km - fastest.distance_km) /
                            fastest.distance_km) * 100;

                    extraDistances.push(extraDistancePercent);
                }
            }

            await sleep(DELAY_MS);
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

        const successful = TOTAL - failureCount;

        const ci95 = confidenceInterval95(results);

        return NextResponse.json({
            total_routes: TOTAL,
            successful_routes: TOTAL - failureCount,
            failed_routes: failureCount,
            divergence_rate:
                successful > 0
                    ? (divergenceCount / successful) * 100
                    : 0,
            avg_percentage_saved: avg(results),
            median_percentage_saved: median(results),
            max_percentage_saved: results.length > 0 ? Math.max(...results) : 0,
            avg_extra_distance_percent: avg(extraDistances),
            ci95_percentage_saved: ci95
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

function standardDeviation(arr: number[]) {
    const n = arr.length;
    if (n < 2) return 0;

    const mean =
        arr.reduce((a, b) => a + b, 0) / n;

    const variance =
        arr.reduce((sum, value) =>
            sum + Math.pow(value - mean, 2), 0
        ) / (n - 1);

    return Math.sqrt(variance);
}

function confidenceInterval95(arr: number[]) {
    const n = arr.length;
    if (n < 2) {
        return { lower: 0, upper: 0 };
    }

    const mean =
        arr.reduce((a, b) => a + b, 0) / n;

    const stdDev = standardDeviation(arr);

    const standardError =
        stdDev / Math.sqrt(n);

    const margin =
        1.96 * standardError;

    return {
        lower: mean - margin,
        upper: mean + margin,
    };
}
