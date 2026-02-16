
import React from "react";
import RouteCard from "./RouteCard";

interface SidebarProps {
    origin: string;
    setOrigin: (val: string) => void;
    destination: string;
    setDestination: (val: string) => void;
    onSubmit: () => void;
    routes: any[];
    selectedIndex: number;
    setSelectedIndex: (index: number) => void;
    loading?: boolean;
}

export default function Sidebar({
    origin,
    setOrigin,
    destination,
    setDestination,
    onSubmit,
    routes,
    selectedIndex,
    setSelectedIndex,
    loading = false,
}: SidebarProps) {
    return (
        <div className="w-full md:w-[400px] lg:w-[450px] flex-shrink-0 flex flex-col h-screen border-r border-slate-200 bg-white/90 backdrop-blur-xl z-20 shadow-2xl relative transition-all duration-300">
            <div className="p-6 border-b border-slate-100/80 bg-gradient-to-b from-white to-slate-50/50 space-y-6">
                {/* Header */}
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-indigo-200 shadow-lg">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.894-.553L16 6m0 12V6" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 tracking-tight">EcoRoute</h1>
                    </div>
                    <p className="text-sm text-slate-500 font-medium ml-12">Smart pollution-aware navigation</p>
                </div>

                {/* Inputs */}
                <div className="space-y-4">
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-[3px] border-emerald-500 bg-white pointer-events-none z-10 shadow-sm"></div>
                        <input
                            className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm group-hover:shadow-md"
                            value={origin}
                            onChange={(e) => setOrigin(e.target.value)}
                            placeholder="Origin (lat,lng)"
                        />
                    </div>

                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-[3px] border-rose-500 bg-white pointer-events-none z-10 shadow-sm"></div>
                        <input
                            className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all shadow-sm group-hover:shadow-md"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            placeholder="Destination (lat,lng)"
                        />
                        {/* Dotted Connector Line */}
                        <div className="absolute left-[19px] -top-6 bottom-6 w-0.5 border-l-2 border-dotted border-slate-300 -z-0 h-10"></div>
                    </div>

                    <button
                        onClick={onSubmit}
                        disabled={loading}
                        className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 active:scale-[0.98] text-white rounded-xl font-bold tracking-wide shadow-lg shadow-indigo-500/30 ring-1 ring-white/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Analyzing Routes...
                            </>
                        ) : (
                            "Find Best Route"
                        )}
                    </button>
                </div>
            </div>

            {/* Results Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-4 bg-slate-50/50">
                {routes.length > 0 ? (
                    <>
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Suggested Routes</h2>
                            <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{routes.length} found</span>
                        </div>
                        <div className="space-y-4">
                            {routes.map((route, index) => (
                                <RouteCard
                                    key={index}
                                    route={route}
                                    index={index}
                                    isSelected={selectedIndex === index}
                                    onClick={() => setSelectedIndex(index)}
                                />
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl m-6">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-600 mb-1">Start Navigation</h3>
                        <p className="text-sm">Enter origin and destination coordinates to find the cleanest path.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
