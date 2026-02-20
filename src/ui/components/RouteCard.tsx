import { RouteModel } from "@/shared/types/route";
import { LeafIcon } from "./Icons";
import { SFText } from "./SFText";

export function aqiStyle(aqi: number) {
    if (aqi <= 50) return { color: "#34C759", label: "Good" };
    if (aqi <= 100) return { color: "#FFCC00", label: "Moderate" };
    if (aqi <= 150) return { color: "#FF9500", label: "Unhealthy (SG)" };
    return { color: "#FF3B30", label: "Unhealthy" };
}

export function RouteCard({
    route,
    isActive,
    onClick,
    onMouseEnter,
    onMouseLeave,
}: {
    route: RouteModel;
    isActive: boolean;
    onClick: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}) {
    const aqi = Math.round(route.average_pollution);
    const style = aqiStyle(aqi);
    const isCleanest = route.is_selected && !route.is_fastest;

    return (
        <div
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className={`
                relative cursor-pointer py-3.5 px-3 transition-all duration-300 border-b-[0.5px] border-gray-200 last:border-none mx-1 rounded-[14px]
                ${isActive
                    ? "bg-white/60 shadow-sm border-[1.5px] border-[#34C759] scale-[1.02] z-10"
                    : "bg-transparent hover:bg-black/[0.03]"
                }
            `}
        >
            <div className="flex justify-between items-center">
                <div className="flex flex-col">
                    <div className="flex items-baseline gap-1">
                        <span className="text-[28px] font-semibold text-black tracking-[-0.8px] leading-none">
                            {Math.round(route.duration_min)}
                        </span>
                        <span className={`${SFText.Subheadline} text-black/50`}>min</span>
                    </div>

                    {/* Minimal AQI Indicator aligned under time */}
                    <div className="flex items-center gap-1.5 mt-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: style.color }} />
                        <span className={`${SFText.Caption1} text-black/60`}>AQI {aqi}</span>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                    {/* Cleanest / Fastest Identifiers */}
                    <div className="flex items-center gap-1.5">
                        {isCleanest && (
                            <LeafIcon className="w-3.5 h-3.5 text-[#34C759]" />
                        )}
                        {route.is_fastest && (
                            <span className={`${SFText.Caption1} text-black/40 uppercase tracking-wide`}>Fastest</span>
                        )}
                    </div>

                    <span className={`${SFText.Footnote} text-black/40 mt-1`}>
                        {route.distance_km.toFixed(1)} km
                    </span>
                </div>
            </div>

            {/* Savings text */}
            {route.savings_tag && (
                <p className={`${SFText.Caption2} text-[#34C759] mt-2.5`}>{route.savings_tag}</p>
            )}
        </div>
    );
}
