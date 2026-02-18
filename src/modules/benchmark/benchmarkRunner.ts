import { randomPointInChandigarh } from "@/domain/city";
import { env } from "@/shared/env";

const BASE_URL = env.NEXT_PUBLIC_BASE_URL;

interface BenchmarkRouteEntry {
    distance_km: number;
    pollution_load_index: number;
    exposure_score: number;
    is_selected: boolean;
}

// ── Stats utilities ──

export function avg(arr: number[]): number {
    return arr.length === 0
        ? 0
        : arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function median(arr: number[]): number {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
}

export function standardDeviation(arr: number[]): number {
    const n = arr.length;
    if (n < 2) return 0;

    const mean = arr.reduce((a, b) => a + b, 0) / n;
    const variance =
        arr.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (n - 1);

    return Math.sqrt(variance);
}

export function confidenceInterval95(arr: number[]) {
    const n = arr.length;
    if (n < 2) return { lower: 0, upper: 0 };

    const mean = arr.reduce((a, b) => a + b, 0) / n;
    const margin = 1.96 * (standardDeviation(arr) / Math.sqrt(n));

    return { lower: mean - margin, upper: mean + margin };
}

// ── Route fetching ──

async function fetchRouteWithRetry(
    origin: number[],
    destination: number[],
    retries = 2
) {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(`${BASE_URL}/api/route`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ origin, destination }),
            });

            if (res.ok) return res.json();
        } catch { }

        await new Promise(r => setTimeout(r, 500));
    }

    return null;
}

// ── Benchmark runner ──

export interface BenchmarkParams {
    total: number;
    batchSize: number;
    delayMs: number;
    pollutionKey: "pollution_load_index" | "exposure_score";
}

export interface BenchmarkResult {
    total_routes: number;
    successful_routes: number;
    failed_routes: number;
    divergence_rate: number;
    avg_percentage_saved: number;
    median_percentage_saved: number;
    max_percentage_saved: number;
    avg_extra_distance_percent: number;
    ci95_percentage_saved?: { lower: number; upper: number };
    raw_percentage_saved?: number[];
}

export async function runBenchmark(params: BenchmarkParams): Promise<BenchmarkResult> {
    const { total, batchSize, delayMs, pollutionKey } = params;

    let divergenceCount = 0;
    let failureCount = 0;

    const percentageSavings: number[] = [];
    const extraDistances: number[] = [];

    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

    for (let i = 0; i < total; i += batchSize) {
        const batchPromises = [];

        for (let j = 0; j < batchSize && i + j < total; j++) {
            const origin = randomPointInChandigarh();
            const destination = randomPointInChandigarh();

            batchPromises.push(
                fetchRouteWithRetry(origin, destination).then(data => {
                    if (!data) failureCount++;
                    return data;
                })
            );
        }

        const batchResults = await Promise.all(batchPromises);

        for (const data of batchResults) {
            if (!data?.routes) continue;

            const fastest = data.routes.reduce((prev: BenchmarkRouteEntry, curr: BenchmarkRouteEntry) =>
                curr.distance_km < prev.distance_km ? curr : prev
            );

            const selected = data.routes.find((r: BenchmarkRouteEntry) => r.is_selected);
            if (!selected) continue;

            const pollutionSaved = fastest[pollutionKey] - selected[pollutionKey];

            if (pollutionSaved > 0) {
                divergenceCount++;

                percentageSavings.push(
                    (pollutionSaved / fastest[pollutionKey]) * 100
                );

                extraDistances.push(
                    ((selected.distance_km - fastest.distance_km) /
                        fastest.distance_km) * 100
                );
            }
        }

        await sleep(delayMs);
    }

    const successful = total - failureCount;

    return {
        total_routes: total,
        successful_routes: successful,
        failed_routes: failureCount,
        divergence_rate: successful > 0
            ? (divergenceCount / successful) * 100
            : 0,
        avg_percentage_saved: avg(percentageSavings),
        median_percentage_saved: median(percentageSavings),
        max_percentage_saved: percentageSavings.length > 0
            ? Math.max(...percentageSavings)
            : 0,
        avg_extra_distance_percent: avg(extraDistances),
        ci95_percentage_saved: confidenceInterval95(percentageSavings),
        raw_percentage_saved: percentageSavings,
    };
}
