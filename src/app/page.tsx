"use client";

import dynamic from "next/dynamic";
import Sidebar from "@/ui/Sidebar";
import { useRoutePlanner } from "@/ui/hooks/useRoutePlanner";

const MapWithRoute = dynamic(() => import("@/ui/MapWithRoute"), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-slate-100">Loading Map...</div>,
});

export default function Home() {
  const { state, actions } = useRoutePlanner();

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-screen overflow-hidden">
      <div className="w-full md:w-auto h-[55dvh] md:h-[100dvh] order-2 md:order-1 z-10 shrink-0 shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.05)] md:shadow-none">
        <Sidebar
          state={state}
          actions={actions}
        />
      </div>
      <div className="flex-1 relative order-1 md:order-2 h-[45dvh] md:h-[100dvh]">
        <MapWithRoute
          routes={state.routes}
          selectedIndex={state.selectedIndex}
          hoveredIndex={state.hoveredIndex}
        />

        <div className="absolute top-4 md:top-6 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none w-max max-w-[90vw]">
          <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm rounded-full px-4 py-1.5 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
            <span className="text-[11px] md:text-[13px] font-medium tracking-[-0.08px] text-black/70 truncate">
              Optimized for the Chandigarh Metropolitan Region
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
