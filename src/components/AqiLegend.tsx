import { AQI_BANDS } from "@/lib/aqiInfo";

export default function AqiLegend() {
    return (
        <div className="px-6 pb-4">
            <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    AQI Classification
                </h3>

                <div className="space-y-2">
                    {AQI_BANDS.map((band) => (
                        <div key={band.label} className="flex items-center gap-3">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: band.color }}
                            />
                            <div className="text-xs text-slate-700">
                                <span className="font-semibold">{band.label}</span>
                                {" "}({band.min}–{band.max})
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
