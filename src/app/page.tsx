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
    try {
      setLoading(true);

      // 1. Geocode origin
      const originRes = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: origin }),
      });

      const originData = await originRes.json();

      if (!originRes.ok) {
        alert(originData.error);
        setLoading(false);
        return;
      }

      // 2. Geocode destination
      const destRes = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: destination }),
      });

      const destData = await destRes.json();

      if (!destRes.ok) {
        alert(destData.error);
        setLoading(false);
        return;
      }

      // 3. Call route API with coordinates
      const routeRes = await fetch("/api/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: [originData.lat, originData.lng],
          destination: [destData.lat, destData.lng],
        }),
      });

      const routeData = await routeRes.json();

      if (routeData.routes) {
        setRoutes(routeData.routes);
        setSelectedIndex(0);
      }

      setLoading(false);
    } catch (err) {
      console.error(err);
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

