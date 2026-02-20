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
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar
        state={state}
        actions={actions}
      />
      <div className="flex-1 relative">
        <MapWithRoute
          routes={state.routes}
          selectedIndex={state.selectedIndex}
          hoveredIndex={state.hoveredIndex}
        />

        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
          <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm rounded-full px-4 py-1.5 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
            <span className="text-[13px] font-medium tracking-[-0.08px] text-black/70">
              Optimized for the Chandigarh Metropolitan Region
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
