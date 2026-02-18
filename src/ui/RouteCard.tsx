import { RouteModel } from "@/shared/types/route";

interface RouteCardProps {
    route: RouteModel;
    index: number;
    isSelected: boolean;
    onClick: () => void;
    showDebug?: boolean;
}

export default function RouteCard({ route, index, isSelected, onClick, showDebug = false }: RouteCardProps) {
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

    const styles = getAqiAttributes(route.average_pollution);

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

                    {route.is_fastest && (
                        <span className="text-xs font-semibold text-slate-500">
                            Fastest
                        </span>
                    )}

                    {route.is_selected && !route.is_fastest && (
                        <span className="text-xs font-semibold text-emerald-600">
                            Cleanest
                        </span>
                    )}
                </div>

                {/* Bottom Row: Distance • AQI */}
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                    <span>{route.distance_km} km</span>
                    <span className="text-slate-300">•</span>

                    {/* AQI Dot Badge */}
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${styles.dot}`}></div>
                            <span className="text-slate-600">
                                AQI {Math.round(route.average_pollution)}
                            </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                            {route.risk_level}
                        </div>
                        {showDebug && (
                            <div className="text-[11px] text-slate-400 mt-0.5">
                                Score: {route.composite_score.toFixed(3)}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
