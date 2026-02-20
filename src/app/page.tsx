"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Sidebar from "@/ui/Sidebar";
import { RouteModel } from "@/shared/types/route";
import { geocode, fetchRoutes } from "@/ui/api";
import { GridMeta } from "@/modules/routing/types";

type Status = "idle" | "loading" | "success" | "error";

const MapWithRoute = dynamic(() => import("@/ui/MapWithRoute"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-slate-100 text-slate-400">
      Loading Map...
    </div>
  ),
});

export default function Home() {
  const [origin, setOrigin] = useState("Sector 17");
  const [destination, setDestination] = useState("Sector 22");

  const [routes, setRoutes] = useState<RouteModel[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [gridMeta, setGridMeta] = useState<GridMeta | null>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      setStatus("loading");
      setError(null);

      const originData = await geocode(origin);
      const destData = await geocode(destination);

      const isOriginChandigarh = originData.label?.toLowerCase().includes("chandigarh");
      const isDestChandigarh = destData.label?.toLowerCase().includes("chandigarh");

      if (!isOriginChandigarh || !isDestChandigarh) {
        setStatus("error");
        setError("Routing currently supported only inside Chandigarh.");
        return;
      }

      const response = await fetchRoutes(
        [originData.lat, originData.lng],
        [destData.lat, destData.lng]
      );

      if (!response.routes.length) {
        throw new Error("No routes found.");
      }

      setRoutes(response.routes);
      setGridMeta(response.grid_meta);

      const selected = response.routes.findIndex((r) => r.is_selected);
      setSelectedIndex(selected >= 0 ? selected : 0);

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

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
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Sidebar — anchored flush left */}
      <Sidebar
        origin={origin}
        setOrigin={setOrigin}
        destination={destination}
        setDestination={setDestination}
        onSubmit={handleSubmit}
        routes={routes}
        selectedIndex={selectedIndex}
        setSelectedIndex={setSelectedIndex}
        onHoverRoute={setHoveredIndex}
        loading={status === "loading"}
        error={error}
        exposureSavedPercent={exposureSavedPercent}
        extraDistancePercent={extraDistancePercent}
        gridMeta={gridMeta}
      />

      {/* Map — takes remaining width */}
      <div className="flex-1 relative">
        <MapWithRoute routes={routes} selectedIndex={selectedIndex} hoveredIndex={hoveredIndex} />

        {/* Apple Style Floating Capsule */}
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
