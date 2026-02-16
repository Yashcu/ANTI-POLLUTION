
import React from "react";

interface RouteCardProps {
    route: any;
    index: number;
    isSelected: boolean;
    onClick: () => void;
}

export default function RouteCard({ route, index, isSelected, onClick }: RouteCardProps) {
    const getRiskColor = (level: string) => {
        switch (level) {
            case "Unhealthy":
                return "bg-rose-500";
            case "Unhealthy for Sensitive Groups":
                return "bg-orange-500";
            default:
                return "bg-emerald-500";
        }
    };

    const getRiskTextColor = (level: string) => {
        switch (level) {
            case "Unhealthy":
                return "text-rose-700";
            case "Unhealthy for Sensitive Groups":
                return "text-orange-700";
            default:
                return "text-emerald-700";
        }
    };

    const getRiskBadgeColor = (level: string) => {
        switch (level) {
            case "Unhealthy":
                return "bg-rose-50";
            case "Unhealthy for Sensitive Groups":
                return "bg-orange-50";
            default:
                return "bg-emerald-50";
        }
    };

    return (
        <div
            onClick={onClick}
            className={`
        cursor-pointer rounded-2xl border p-5 transition-all duration-300 ease-out group
        ${isSelected
                    ? "border-indigo-500 bg-white shadow-xl shadow-indigo-500/10 ring-2 ring-indigo-500/20 transform scale-[1.02]"
                    : "border-slate-100 bg-white hover:border-indigo-200 hover:shadow-lg hover:shadow-slate-200/50 hover:scale-[1.01]"
                }
      `}
        >
            {/* Top Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isSelected ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-500/70"}`}>
                    Option {index + 1}
                </h3>
                <div className="flex gap-2">
                    {route.is_fastest && (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-100">
                            FASTEST
                        </span>
                    )}
                    {route.is_cleanest && (
                        <span className="inline-flex items-center rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700 border border-violet-100">
                            CLEANEST
                        </span>
                    )}
                </div>
            </div>

            {/* Main Stats */}
            <div className="flex items-baseline gap-3 mb-5">
                <span className="text-3xl font-extrabold text-slate-800 tracking-tight">
                    {route.duration_min} <span className="text-sm font-semibold text-slate-400 -ml-1">min</span>
                </span>
                <span className="h-4 w-px bg-slate-200"></span>
                <span className="text-sm font-semibold text-slate-500">
                    {route.distance_km} km
                </span>
            </div>

            {/* Pollution / Risk Section */}
            <div className="space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-400">P. Exposure Index</span>
                    <span className={`font-bold ${getRiskTextColor(route.risk_level)} ${getRiskBadgeColor(route.risk_level)} px-2 py-0.5 rounded-md`}>
                        {route.risk_level}
                    </span>
                </div>

                <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden ring-1 ring-slate-100">
                    <div
                        className={`h-full rounded-full ${getRiskColor(route.risk_level)} shadow-sm`}
                        style={{ width: `${Math.min(route.exposure_score / 2, 100)}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
