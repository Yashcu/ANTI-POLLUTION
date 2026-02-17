
import React from "react";

interface RouteCardProps {
    route: any;
    index: number;
    isSelected: boolean;
    onClick: () => void;
}

export default function RouteCard({ route, index, isSelected, onClick }: RouteCardProps) {
    // Dynamic AQI Styling Logic
    const getAqiAttributes = (aqi: number) => {
        if (aqi <= 50) return {
            dot: "bg-emerald-500",
            selectedBg: "bg-emerald-50/80",
            text: "text-emerald-700"
        };
        if (aqi <= 100) return {
            dot: "bg-yellow-500",
            selectedBg: "bg-yellow-50/80",
            text: "text-yellow-700"
        };
        if (aqi <= 150) return {
            dot: "bg-orange-500",
            selectedBg: "bg-orange-50/80",
            text: "text-orange-700"
        };
        return {
            dot: "bg-rose-500",
            selectedBg: "bg-rose-50/80",
            text: "text-rose-700"
        };
    };

    const styles = getAqiAttributes(route.exposure_score);

    return (
        <div
            onClick={onClick}
            className={`
                cursor-pointer p-4 transition-all duration-200 ease-out group relative border-b border-slate-100 last:border-none
                ${isSelected
                    ? styles.selectedBg
                    : "bg-transparent hover:bg-slate-50"
                }
            `}
        >
            <div className="flex flex-col gap-1.5">
                {/* Top Row: Time | Badges */}
                <div className="flex justify-between items-center">
                    <span className={`text-2xl font-bold tracking-tight ${isSelected ? 'text-slate-900' : 'text-slate-900'}`}>
                        {Math.round(route.duration_min)} <span className="text-sm font-semibold text-slate-400">min</span>
                    </span>

                    <div className="flex gap-2">
                        {/* CO2 Savings Badge (Cleanest) - Dynamic "Less Toxic" Tag */}
                        {route.savings_tag && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100/50 border border-emerald-100">
                                <svg className="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 24 24"><path d="M17,8C8,10,5.9,16.17,3.82,21.34L5.71,22l1-2.3A4.49,4.49,0,0,0,8,20C19,20,22,3,22,3,21,5,14,5.25,9,6.25S2,11.5,2,13.5a6.22,6.22,0,0,0,1.75,4.25C6,9.5,17,8,17,8Z" /></svg>
                                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">{route.savings_tag}</span>
                            </div>
                        )}
                        {/* Fastest Badge */}
                        {route.is_fastest && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white shadow-sm">
                                Fastest
                            </span>
                        )}
                    </div>
                </div>

                {/* Bottom Row: Distance • AQI */}
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                    <span>{route.distance_km} km</span>
                    <span className="text-slate-300">•</span>

                    {/* AQI Dot Badge */}
                    <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${styles.dot}`}></div>
                        <span className="text-slate-600">
                            AQI {Math.round(route.exposure_score)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
