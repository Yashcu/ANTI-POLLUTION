import { AQI_BANDS } from "@/domain/aqiInfo";
import { SearchInput } from "@/ui/components/SearchInput";
import { RouteCard } from "@/ui/components/RouteCard";
import { Accordion, Row } from "@/ui/components/Accordion";
import { LeafIcon } from "@/ui/components/Icons";
import { SFText } from "@/ui/components/SFText";
import { RouteModel } from "@/shared/types/route";
import { GridMeta } from "@/modules/routing/types";

// Need exactly what we pass in
type Status = "idle" | "loading" | "success" | "error";

interface SidebarProps {
    state: {
        origin: string;
        destination: string;
        routes: RouteModel[];
        selectedIndex: number;
        hoveredIndex: number | null;
        gridMeta: GridMeta | null;
        status: Status;
        error: string | null;
    };
    actions: {
        setOrigin: (val: string) => void;
        setDestination: (val: string) => void;
        setSelectedIndex: (idx: number) => void;
        setHoveredIndex: (idx: number | null) => void;
        calculateRoute: () => void;
    };
}

function timeAgo(minutes: number): string {
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${Math.round(minutes)}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${Math.round(minutes % 60)}m ago`;
}

export default function Sidebar({ state, actions }: SidebarProps) {
    const { origin, destination, routes, selectedIndex, gridMeta, status, error } = state;
    const { setOrigin, setDestination, setSelectedIndex, setHoveredIndex, calculateRoute } = actions;

    const loading = status === "loading";

    const fastestRoute = routes.find((r) => r.is_fastest);
    const cleanestRoute = routes.find((r) => r.is_selected);

    let exposureSavedPercent: number | null = null;
    let extraDistancePercent: number | null = null;

    if (fastestRoute && cleanestRoute && fastestRoute !== cleanestRoute) {
        exposureSavedPercent =
            ((fastestRoute.pollution_load_index - cleanestRoute.pollution_load_index) /
                fastestRoute.pollution_load_index) *
            100;

        extraDistancePercent =
            ((cleanestRoute.distance_km - fastestRoute.distance_km) /
                fastestRoute.distance_km) *
            100;
    }

    return (
        <div className="w-[360px] shrink-0 h-screen flex flex-col bg-white/80 backdrop-blur-xl border-r border-black/5 shadow-[20px_0_30px_-10px_rgba(0,0,0,0.03)] z-[1000] relative">
            <div className="flex flex-col h-full overflow-hidden">
                {/* ─── Header & Inputs ─── */}
                <div className="p-5 pb-3 space-y-4 shrink-0">
                    <h1 className={`${SFText.Title2} px-1`}>Route</h1>
                    <SearchInput origin={origin} setOrigin={setOrigin} destination={destination} setDestination={setDestination} />
                    {error && (
                        <div className={`mt-2 ${SFText.Footnote} text-[#FF3B30] bg-[#FF3B30]/10 px-3 py-2 rounded-lg`}>
                            {error}
                        </div>
                    )}
                </div>

                {/* ─── Scrollable Content ─── */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 pt-0 space-y-2 scrollbar-hide">
                    {/* Empty State / Welcome */}
                    {routes.length === 0 && !loading && (
                        <div className="mt-8 px-2 flex flex-col items-center justify-center text-center opacity-70">
                            <svg className="w-12 h-12 text-black/20 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8m0 0V3m0 10h9m-9 0H3" />
                            </svg>
                            <h2 className={`${SFText.Headline} text-black/80 mb-1`}>Welcome to Chandigarh</h2>
                            <p className={`${SFText.Caption1} text-black/50`}>Enter a starting point and destination to find the cleanest, fastest route through the city.</p>
                        </div>
                    )}

                    {/* Routes List */}
                    {routes.length > 0 && (
                        <div className="mt-2 bg-white/40 border border-black/[0.04] rounded-[14px] overflow-hidden">
                            {routes.map((route, i) => (
                                <RouteCard
                                    key={i}
                                    route={route}
                                    isActive={selectedIndex === i}
                                    onClick={() => setSelectedIndex(i)}
                                    onMouseEnter={() => setHoveredIndex(i)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                />
                            ))}
                        </div>
                    )}

                    {/* ─── Progressive Disclosure ─── */}
                    {(gridMeta || routes.length > 0) && (
                        <div className="space-y-2 pt-4 pb-4">
                            {exposureSavedPercent !== null && exposureSavedPercent > 0 && (
                                <div className="mb-4 px-2">
                                    <div className={`flex items-center gap-1.5 ${SFText.Caption1} text-[#34C759] font-medium`}>
                                        <LeafIcon className="w-4 h-4" />
                                        {exposureSavedPercent.toFixed(0)}% less pollution exposure
                                    </div>
                                    {extraDistancePercent !== null && extraDistancePercent > 0 && (
                                        <div className={`${SFText.Caption2} text-black/40 ml-5 mt-0.5`}>
                                            Adds {extraDistancePercent.toFixed(0)}% distance
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Environmental Data */}
                            {gridMeta && (
                                <Accordion title="Environmental Data & Sources">
                                    <div className="space-y-1">
                                        <Row label="Data Source" value={gridMeta.source} />
                                        <Row label="Interpolation" value={gridMeta.interpolation} />
                                        <Row
                                            label="Last Updated"
                                            value={timeAgo(gridMeta.freshness_minutes)}
                                            valueClass={
                                                gridMeta.freshness_minutes > 120 ? "text-[#FF3B30] font-medium"
                                                    : gridMeta.freshness_minutes > 60 ? "text-[#FF9500] font-medium"
                                                        : "text-[#34C759] font-medium"
                                            }
                                        />
                                    </div>
                                </Accordion>
                            )}

                            {/* AQI Legend */}
                            {AQI_BANDS && (
                                <Accordion title="Understanding AQI">
                                    <div className="space-y-3">
                                        {AQI_BANDS.map(band => (
                                            <div key={band.label} className="flex items-start gap-3">
                                                <div
                                                    className="w-3 h-3 rounded-full mt-[3px] shrink-0"
                                                    style={{ backgroundColor: band.color }}
                                                />
                                                <div className="flex flex-col">
                                                    <div className="flex items-baseline gap-1.5">
                                                        <span className={`${SFText.Caption1} font-semibold text-black/80`}>
                                                            {band.label}
                                                        </span>
                                                        <span className={`${SFText.Caption2} text-black/40`}>
                                                            ({band.min}–{band.max})
                                                        </span>
                                                    </div>
                                                    <p className={`${SFText.Caption2} text-black/50 mt-0.5 leading-relaxed`}>
                                                        {band.healthImpact}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Accordion>
                            )}

                            {/* Exposure Explainer */}
                            <Accordion title="How Exposure is Calculated">
                                <div className="space-y-2">
                                    <p className={`${SFText.Caption1} text-black/60 leading-relaxed`}>
                                        Exposure is defined as the aggregate pollution dose sustained during transit, integrating both environmental air quality metrics and the total time of exposure per zone.
                                    </p>
                                    <p className={`${SFText.Caption1} text-black/50 leading-relaxed`}>
                                        As such, prioritizing absolute distance over air quality can be detrimental; a brief commute through heavily polluted sectors often constitutes a greater health hazard than a longer, cleaner route.
                                    </p>
                                </div>
                            </Accordion>
                        </div>
                    )}
                </div>

                {/* ─── Bottom Pinned CTA ─── */}
                <div className="p-4 pb-6 shrink-0 relative">
                    <button
                        onClick={calculateRoute}
                        disabled={loading}
                        className={`
                            w-full h-12 bg-gradient-to-b from-[#34C759] to-[#2FB350] active:from-[#2FB350] active:to-[#289A45] hover:opacity-95 text-white rounded-[16px] 
                            ${SFText.Headline} shadow-[inset_0_1.5px_0_rgba(255,255,255,0.25),0_10px_15px_-3px_rgba(34,197,94,0.4)] 
                            transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2
                        `}
                    >
                        {loading ? (
                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        ) : (
                            "Find Best Route"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}