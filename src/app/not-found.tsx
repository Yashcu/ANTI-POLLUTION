import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Inline styles for custom map animations */}
            <style>{`
        .route-path {
          stroke-dasharray: 400;
          stroke-dashoffset: 400;
          animation: drawPath 3s ease-out forwards;
        }
        .route-path-lost {
          stroke-dasharray: 10 15;
          animation: driftPath 10s linear infinite;
        }
        @keyframes drawPath {
          to { stroke-dashoffset: 0; }
        }
        @keyframes driftPath {
          to { stroke-dashoffset: -100; }
        }
        .map-bg-line {
          stroke-dasharray: 5 10;
        }
        .radar-sweep {
          animation: radarSweep 4s linear infinite;
          transform-origin: 50% 50%;
        }
        @keyframes radarSweep {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .marker-bounce {
          animation: markerBounce 2s ease-in-out infinite;
          transform-origin: bottom center;
        }
        @keyframes markerBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        .shadow-pulse {
          animation: shadowPulse 2s ease-in-out infinite;
          transform-origin: center;
        }
        @keyframes shadowPulse {
          0%, 100% { transform: scale(1) rotateX(70deg); opacity: 0.3; }
          50% { transform: scale(0.6) rotateX(70deg); opacity: 0.1; }
        }
        .pulse-ring {
          animation: pulseRing 3s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
          transform-origin: center;
        }
        @keyframes pulseRing {
          0% { transform: scale(0.5); opacity: 0; }
          50% { opacity: 0.2; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .shimmer-effect {
          animation: shimmer 2s infinite;
        }
        @keyframes shimmer {
          100% { transform: translateX(400%); }
        }
      `}</style>

            {/* Background Decor - Grid */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] text-slate-900 z-0">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="gridPattern" width="60" height="60" patternUnits="userSpaceOnUse">
                            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#gridPattern)" />
                </svg>
            </div>

            {/* Main Container */}
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center max-w-5xl w-full gap-8 sm:gap-12 lg:gap-16 px-4">

                {/* Animated Map Graphic */}
                <div className="relative w-52 h-52 sm:w-72 sm:h-72 lg:w-[400px] lg:h-[400px] bg-white rounded-full shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border-8 border-slate-100 flex items-center justify-center overflow-hidden z-0 shrink-0 mx-auto">

                    {/* Subtle Map Background Lines */}
                    <svg className="absolute inset-0 w-full h-full opacity-10 text-slate-800" viewBox="0 0 200 200">
                        <path d="M 20,40 L 180,50 L 190,160 L 10,180 Z" fill="none" stroke="currentColor" strokeWidth="2" className="map-bg-line" />
                        <path d="M 40,0 L 60,200 M 140,0 L 120,200 M 0,80 L 200,100 M 0,140 L 200,130" fill="none" stroke="currentColor" strokeWidth="1" />
                        <path d="M 80,0 L 90,200 M 170,0 L 160,200 M 0,50 L 200,60 M 0,170 L 200,160" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    </svg>

                    {/* Radar Sweep Effect */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                        <div className="w-[90%] h-[90%] rounded-full border border-slate-500 absolute"></div>
                        <div className="w-[65%] h-[65%] rounded-full border border-slate-500 absolute"></div>
                        <div className="w-[40%] h-[40%] rounded-full border border-slate-500 absolute"></div>
                        <div className="w-[15%] h-[15%] rounded-full border border-slate-500 absolute"></div>
                        {/* Radar Sweep Line */}
                        <svg viewBox="0 0 200 200" className="absolute w-full h-full radar-sweep text-teal-600">
                            <defs>
                                <linearGradient id="radarGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
                                    <stop offset="100%" stopColor="currentColor" stopOpacity="0.5" />
                                </linearGradient>
                            </defs>
                            <path d="M 100,100 L 100,0 A 100,100 0 0,1 170.7,29.3 Z" fill="url(#radarGrad)" />
                            <line x1="100" y1="100" x2="100" y2="0" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                    </div>

                    {/* Animated Route Line */}
                    <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full">
                        {/* The base path representing lost tracking */}
                        <path
                            d="M 20,160 C 50,150 70,110 90,120 C 110,130 110,90 140,80"
                            fill="none"
                            stroke="#cbd5e1"
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="route-path-lost"
                        />
                        {/* The active path drawing overlay */}
                        <path
                            d="M 20,160 C 50,150 70,110 90,120 C 110,130 110,90 140,80"
                            fill="none"
                            stroke="#0ea5e9"
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="route-path"
                        />
                    </svg>

                    {/* Location Pin */}
                    <div className="absolute flex flex-col items-center right-[15%] sm:right-[20%] top-[25%]">
                        {/* Pulse rings */}
                        <div className="absolute w-12 h-12 bg-red-400 rounded-full pulse-ring" style={{ animationDelay: '0s' }}></div>
                        <div className="absolute w-12 h-12 bg-red-400 rounded-full pulse-ring" style={{ animationDelay: '1.5s' }}></div>

                        <div className="relative z-10 marker-bounce text-red-500">
                            <svg viewBox="0 0 24 24" className="w-14 h-14 drop-shadow-xl" stroke="currentColor" strokeWidth="0">
                                <path fill="currentColor" d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                                <text x="12" y="13.5" textAnchor="middle" fontSize="9" fill="white" fontWeight="900" fontFamily="sans-serif">?</text>
                            </svg>
                        </div>
                        {/* Marker Drop Shadow */}
                        <div className="w-6 h-2 bg-slate-400 rounded-full shadow-pulse mt-1"></div>
                    </div>

                </div>

                {/* Text and Actions */}
                <div className="text-center lg:text-left z-10 bg-white/80 p-6 sm:p-8 lg:p-10 rounded-3xl backdrop-blur-md border border-slate-100 shadow-xl shadow-slate-200/50 max-w-lg lg:max-w-xl w-full shrink-0 flex flex-col items-center lg:items-start mx-auto">
                    <div className="inline-block bg-sky-100/80 text-sky-700 font-semibold px-4 py-1.5 rounded-full text-xs sm:text-sm mb-4 sm:mb-5 tracking-wide border border-sky-200/50 uppercase shadow-sm">
                        Recalculating Route...
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-800 mb-4 tracking-tight">
                        Off the <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-indigo-500">Grid!</span>
                    </h1>
                    <p className="text-slate-500 text-base sm:text-lg mb-8 leading-relaxed">
                        Oops! It looks like you've wandered into an uncharted zone (Error 404). We couldn't find the location you were looking for.
                    </p>

                    <Link
                        href="/"
                        className="group relative inline-flex items-center justify-center space-x-2 px-8 py-4 font-semibold text-white transition-all duration-300 ease-in-out bg-slate-900 rounded-2xl hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/20 active:scale-95 overflow-hidden w-full sm:w-auto"
                    >
                        <div className="absolute inset-0 w-1/4 h-full bg-white/10 skew-x-12 -translate-x-[200%] group-hover:shimmer-effect"></div>
                        <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span>Return to Map HQ</span>
                    </Link>
                </div>

            </div>
        </div>
    );
}
