export default function ExposureInfo() {
    return (
        <div className="px-6 pb-4">
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Why Cumulative Exposure?
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed">
                    Exposure is the total pollution dose experienced along the entire route.
                    It combines pollution intensity and time spent in polluted areas.
                </p>

                <p className="text-xs text-slate-500 leading-relaxed">
                    A shorter route through high-AQI zones may result in greater health risk
                    than a slightly longer route with cleaner air.
                </p>
            </div>
        </div>
    );
}
