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

        <div className="absolute top-6 left-6 bottom-6 w-full md:w-[420px] z-50 flex flex-col justify-center pointer-events-none">

            {/* Floating Card Container - Pointer events auto to allow interaction */}

            <div className="bg-white/95 backdrop-blur-xl rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-white/20 pointer-events-auto flex flex-col max-h-full overflow-hidden transition-all duration-300">



                {/* Header & Inputs */}

                <div className="p-6 space-y-6 shrink-0">

                    {/* Header */}

                    <div className="flex items-center gap-3">

                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">

                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.894-.553L16 6m0 12V6" />

                            </svg>

                        </div>

                        <div>

                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">EcoRoute</h1>

                            <p className="text-xs text-slate-500 font-medium mt-1">Smart pollution-aware navigation</p>

                        </div>

                    </div>



                    {/* Inputs with Connector */}

                    <div className="relative p-2">

                        {/* Connector Graphic */}

                        <div className="absolute left-[22px] top-[26px] bottom-[26px] flex flex-col items-center justify-between pointer-events-none z-10">

                            {/* Start Circle */}

                            <div className="w-3 h-3 rounded-full bg-slate-800 border-2 border-slate-300 ring-2 ring-white"></div>



                            {/* Dotted Line */}

                            <div className="w-0.5 grow border-l-2 border-dotted border-slate-300 my-0"></div>



                            {/* End Square/Pin */}

                            <div className="w-3 h-3 bg-slate-800 border-2 border-slate-300 ring-2 ring-white rotate-45"></div>

                        </div>



                        <div className="space-y-3">

                            {/* Origin Input */}

                            <div className="relative">

                                <input

                                    className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border-none rounded-xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:bg-white transition-all shadow-sm"

                                    value={origin}

                                    onChange={(e) => setOrigin(e.target.value)}

                                    placeholder="Enter pickup location"

                                />

                            </div>



                            {/* Destination Input */}

                            <div className="relative">

                                <input

                                    className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border-none rounded-xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:bg-white transition-all shadow-sm"

                                    value={destination}

                                    onChange={(e) => setDestination(e.target.value)}

                                    placeholder="Enter destination"

                                />

                            </div>

                        </div>

                    </div>



                    <button

                        onClick={onSubmit}

                        disabled={loading}

                        className="w-full py-3.5 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] text-white rounded-xl font-bold tracking-wide shadow-lg shadow-slate-900/20 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"

                    >

                        {loading ? (

                            <>

                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">

                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>

                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>

                                </svg>

                                <span>Analyzing Routes...</span>

                            </>

                        ) : (

                            "Find Best Route"

                        )}

                    </button>

                </div>



                {/* Results Area (Scrollable) */}

                <div className="flex-1 overflow-y-auto overflow-x-hidden pt-0">

                    {routes.length > 0 && (

                        <>

                            <div className="flex items-center justify-between px-6 sticky top-0 bg-white/95 backdrop-blur-xl py-3 z-10 border-b border-slate-100">

                                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Suggested Routes</h2>

                                <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{routes.length} found</span>

                            </div>

                            <div className="pb-4">

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

                    )}

                </div>

            </div>

        </div>

    );

}