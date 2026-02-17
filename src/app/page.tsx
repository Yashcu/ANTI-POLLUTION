"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Sidebar from "@/components/Sidebar";
import { GridMeta, RouteModel } from "@/types/route";
import { geocode, fetchRoutes } from "@/lib/api";

type Status = "idle" | "loading" | "success" | "error";

const MapWithRoute = dynamic(() => import("@/components/MapWithRoute"), {
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
  const [gridMeta, setGridMeta] = useState<GridMeta | null>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      setStatus("loading");
      setError(null);

      const originData = await geocode(origin);
      const destData = await geocode(destination);

      // Validate region
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
      ((fastestRoute.exposure_score - cleanestRoute.exposure_score) /
        fastestRoute.exposure_score) *
      100;

    extraDistancePercent =
      ((cleanestRoute.distance_km - fastestRoute.distance_km) /
        fastestRoute.distance_km) *
      100;
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-slate-50">
      <div className="absolute inset-0 z-0">
        <MapWithRoute routes={routes} selectedIndex={selectedIndex} />
      </div>

      <Sidebar
        origin={origin}
        setOrigin={setOrigin}
        destination={destination}
        setDestination={setDestination}
        onSubmit={handleSubmit}
        routes={routes}
        selectedIndex={selectedIndex}
        setSelectedIndex={setSelectedIndex}
        loading={status === "loading"}
        error={error}
        exposureSavedPercent={exposureSavedPercent}
        extraDistancePercent={extraDistancePercent}
        gridMeta={gridMeta}
      />
    </div>
  );
}
