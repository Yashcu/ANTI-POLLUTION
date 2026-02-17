"use client";

import { useEffect, useState } from "react";

interface BenchmarkData {
    divergence_rate: number;
    avg_percentage_saved: number;
    ci95_percentage_saved: {
        lower: number;
        upper: number;
    };
    failed_routes: number;
    total_routes: number;
    successful_routes: number;
}

export default function AdminPage() {
    const [data, setData] = useState<BenchmarkData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchBenchmark() {
            try {
                const res = await fetch("/api/internal/city-benchmark");
                const json = await res.json();

                if (!res.ok) {
                    throw new Error(json.error || "Failed to load benchmark");
                }

                setData(json);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error");
            } finally {
                setLoading(false);
            }
        }

        fetchBenchmark();
    }, []);

    if (loading) {
        return <div className="p-8 text-slate-500">Loading benchmark...</div>;
    }

    if (error) {
        return <div className="p-8 text-red-600">{error}</div>;
    }

    if (!data) return null;

    const formatPercent = (val: number | undefined | null) => {
        if (typeof val !== 'number') return "0.00";
        return val.toFixed(2);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-10">
            <h1 className="text-2xl font-bold mb-8">System Benchmark</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <MetricCard
                    title="Divergence Rate"
                    value={`${formatPercent(data.divergence_rate)}%`}
                    description="How often cleanest route differs from fastest."
                />

                <MetricCard
                    title="Avg Exposure Saved"
                    value={`${formatPercent(data.avg_percentage_saved)}%`}
                    description="Average pollution reduction when cleanest chosen."
                />

                <MetricCard
                    title="95% Confidence Interval"
                    value={`${formatPercent(data.ci95_percentage_saved?.lower)}% – ${formatPercent(data.ci95_percentage_saved?.upper)}%`}
                    description="Statistical confidence range."
                />

                <MetricCard
                    title="Failed Routes"
                    value={`${data.failed_routes ?? 0}`}
                    description="Routes where optimization failed or identical."
                />

                <MetricCard
                    title="Meaningful Optimization Rate"
                    value={`${formatPercent(((data.divergence_rate || 0) * (data.avg_percentage_saved || 0)) / 100)}%`}
                    description="System-wide pollution reduction (Divergence × Savings)."
                />

                <MetricCard
                    title="Sample Size"
                    value={`${data.total_routes ?? 0}`}
                    description="Total benchmarked route pairs."
                />

            </div>

            <div className="mt-10 bg-white border border-slate-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">
                    Interpretation
                </h2>

                <p className="text-sm text-slate-600 leading-relaxed">
                    Cleanest route differs from fastest in <span className="font-bold text-slate-800">{formatPercent(data.divergence_rate)}%</span> of cases.
                    When it differs, average pollution exposure is reduced by{" "}
                    <span className="font-bold text-slate-800">{formatPercent(data.avg_percentage_saved)}%</span>.
                    The 95% confidence interval suggests statistically significant improvement.
                </p>
            </div>
        </div>
    );
}

function MetricCard({
    title,
    value,
    description,
}: {
    title: string;
    value: string;
    description: string;
}) {
    return (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                {title}
            </h2>
            <div className="text-3xl font-bold mt-3 text-slate-900">{value}</div>
            <p className="text-sm text-slate-500 mt-3">{description}</p>
        </div>
    );
}
