"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Sidebar from "@/components/Sidebar";

const MapWithRoute = dynamic(() => import("@/components/MapWithRoute"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-slate-100 text-slate-400">
      Loading Map...
    </div>
  ),
});

export default function Home() {
  const [origin, setOrigin] = useState("Delhi Airport");
  const [destination, setDestination] = useState("Noida Sector 18");
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const originArr = origin.split(",").map(Number);
      const destArr = destination.split(",").map(Number);

      const res = await fetch("/api/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: originArr,
          destination: destArr,
        }),
      });

      const data = await res.json();

      if (data.routes) {
        setRoutes(data.routes);
        setSelectedIndex(0);
      }
    } catch (error) {
      console.error("Error fetching routes:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedRoute = routes[selectedIndex];

  const mapRoute =
    selectedRoute?.route?.coordinates?.map(([lng, lat]: [number, number]) => [
      lat,
      lng,
    ]) || [];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <Sidebar
        origin={origin}
        setOrigin={setOrigin}
        destination={destination}
        setDestination={setDestination}
        onSubmit={handleSubmit}
        routes={routes}
        selectedIndex={selectedIndex}
        setSelectedIndex={setSelectedIndex}
        loading={loading}
      />

      {/* Map Area */}
      <div className="flex-1 relative z-0">
        {/* Map Overlay Gradient for smooth transition (optional) */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/5 to-transparent pointer-events-none z-10"></div>

        <MapWithRoute route={mapRoute} />

        {/* Floating Info (optional, can be added later) */}
      </div>
    </div>
  );
}

