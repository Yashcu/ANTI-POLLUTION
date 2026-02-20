import { useState } from "react";
import { GridMeta } from "@/modules/routing/types";
import { RouteModel } from "@/shared/types/route";
import { AQI_BANDS } from "@/domain/aqiInfo";

interface SidebarProps {
    origin: string;
    setOrigin: (val: string) => void;
    destination: string;
    setDestination: (val: string) => void;
    onSubmit: () => void;
    routes: RouteModel[];
    selectedIndex: number;
    setSelectedIndex: (index: number) => void;
    onHoverRoute?: (index: number | null) => void;
    loading?: boolean;
    error?: string | null;
    exposureSavedPercent?: number | null;
    extraDistancePercent?: number | null;
    gridMeta: GridMeta | null;
}

/* ── Helpers ────────────────────────────────────────────── */

function aqiStyle(aqi: number) {
    if (aqi <= 50) return { color: "#34C759", label: "Good" };
    if (aqi <= 100) return { color: "#FFCC00", label: "Moderate" };
    if (aqi <= 150) return { color: "#FF9500", label: "Unhealthy (SG)" };
    return { color: "#FF3B30", label: "Unhealthy" };
}

function timeAgo(minutes: number): string {
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${Math.round(minutes)}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${Math.round(minutes % 60)}m ago`;
}

/* ── SF Pro Typography System ───────────────────────────── */

const SFText = {
    Title2: "text-[22px] leading-7 font-semibold tracking-[-0.41px]",
    Headline: "text-[17px] leading-6 font-semibold tracking-[-0.41px]",
    Body: "text-[17px] leading-6 font-normal tracking-[-0.41px]",
    Callout: "text-[16px] leading-[21px] font-normal tracking-[-0.32px]",
    Subheadline: "text-[15px] leading-[20px] font-normal tracking-[-0.24px]",
    Footnote: "text-[13px] leading-[18px] font-normal tracking-[-0.08px]",
    Caption1: "text-[12px] leading-[16px] font-medium tracking-[0px]",
    Caption2: "text-[11px] leading-[13px] font-medium tracking-[0.06px]",
};

/* ── Apple Icons ────────────────────────────────────────── */

function LeafIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.984 3.016c0 0 4.095-.562 7.03 2.373s2.373 7.03 2.373 7.03c0 9.375-12.188 12.188-12.188 12.188S-.625 21 0 11.625c0 0 .562-4.096 3.497-7.03s7.03-2.373 7.03-2.373l-.001.001zm-.055 2.112c-2.316 0-5.592 1.956-7.859 4.223-2.094 2.094-2.618 5.485-2.618 5.485s4.305-.989 6.83-3.514 6.887-9.524 6.887-9.524c0 0-1.875 3.33-3.24 6.643zm8.397 5.263c-1.353-2.228-4.437-4.63-6.666-4.63 0 0 .97 3.39-1.321 5.682-2.735 2.735-9.255 3.193-9.255 3.193s10.375-1.572 13.921-5.118c2.618-2.618 3.321-5.694 3.321-5.694l.001.001z" />
        </svg>
    );
}

/* ── Clear Button (X) ───────────────────────────────────── */

function ClearButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-[#8E8E93]/20 hover:bg-[#8E8E93]/40 text-black/60 transition-colors"
            aria-label="Clear"
        >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
    );
}

/* ── Collapsible Section (HIG) ──────────────────────────── */

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="bg-white/40 border border-black/[0.04] rounded-[14px] overflow-hidden">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 transition-colors hover:bg-black/[0.02]"
            >
                <span className={`${SFText.Subheadline} font-semibold text-black/70`}>{title}</span>
                <svg
                    className={`w-4 h-4 text-black/30 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>
            {open && <div className="px-4 pb-4 pt-1 leading-relaxed">{children}</div>}
        </div>
    );
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
    return (
        <div className="flex justify-between items-center py-1">
            <span className={`${SFText.Caption1} text-black/50`}>{label}</span>
            <span className={`${SFText.Caption1} ${valueClass || "text-black/80 font-medium"}`}>{value}</span>
        </div>
    );
}

/* ── Route Card (HIG Minimalist) ────────────────────────── */

function RouteCard({
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

/* ── Main Sidebar (Glassmorphism) ───────────────────────── */

export default function Sidebar({
    origin,
    setOrigin,
    destination,
    setDestination,
    onSubmit,
    routes,
    selectedIndex,
    setSelectedIndex,
    onHoverRoute,
    loading = false,
    error = null,
    exposureSavedPercent = null,
    extraDistancePercent = null,
    gridMeta,
}: SidebarProps) {
    return (
        <div className="w-[360px] shrink-0 h-screen flex flex-col bg-white/80 backdrop-blur-xl border-r border-black/5 shadow-[20px_0_30px_-10px_rgba(0,0,0,0.03)] z-[1000] relative">
            <div className="flex flex-col h-full overflow-hidden">

                {/* ─── Header & Inputs ─── */}
                <div className="p-5 pb-3 space-y-4 shrink-0">
                    <h1 className={`${SFText.Title2} px-1`}>Route</h1>

                    {/* Apple Style Minimal Inputs */}
                    <div className="bg-white/60 rounded-[14px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] ring-1 ring-black/5 px-4 relative flex flex-col backdrop-blur-md">

                        {/* Origin */}
                        <div className="flex items-center h-[46px] border-b border-black/[0.04] relative">
                            <div className="w-2.5 h-2.5 rounded-full border-[1.25px] border-[#007AFF] mr-3 shrink-0" />
                            <input
                                className={`w-full bg-transparent ${SFText.Body} text-black placeholder:text-black/30 focus:outline-none`}
                                value={origin}
                                onChange={(e) => setOrigin(e.target.value)}
                                placeholder="Starting Point"
                            />
                            {origin && <ClearButton onClick={() => setOrigin("")} />}
                        </div>

                        {/* Destination */}
                        <div className="flex items-center h-[46px] relative">
                            <div className="w-2.5 h-2.5 rounded-full border-[1.25px] border-[#FF3B30] mr-3 shrink-0" />
                            <input
                                className={`w-full bg-transparent ${SFText.Body} text-black placeholder:text-black/30 focus:outline-none`}
                                value={destination}
                                onChange={(e) => setDestination(e.target.value)}
                                placeholder="Destination"
                            />
                            {destination && <ClearButton onClick={() => setDestination("")} />}
                        </div>
                    </div>

                    {/* Secondary Route Info if Needed */}
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
                                    onMouseEnter={() => onHoverRoute?.(i)}
                                    onMouseLeave={() => onHoverRoute?.(null)}
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

                            {/* Exposure Explainer */}
                            <Accordion title="How Exposure is Calculated">
                                <div className="space-y-2">
                                    <p className={`${SFText.Caption1} text-black/60 leading-relaxed`}>
                                        Exposure is the total pollution dose along your entire route — combining
                                        air quality intensity with time spent in each zone.
                                    </p>
                                    <p className={`${SFText.Caption1} text-black/50 leading-relaxed`}>
                                        A shorter route through high-AQI zones may cause greater health risk
                                        than a slightly longer route with cleaner air.
                                    </p>
                                </div>
                            </Accordion>
                        </div>
                    )}
                </div>

                {/* ─── Bottom Pinned CTA ─── */}
                <div className="p-4 pb-6 shrink-0 relative">
                    <button
                        onClick={onSubmit}
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