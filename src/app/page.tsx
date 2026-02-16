"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const MapWithRoute = dynamic(() => import("@/components/MapWithRoute"), {
  ssr: false,
});

export default function Home() {
  const [origin, setOrigin] = useState("28.6139,77.2090");
  const [destination, setDestination] = useState("28.5355,77.3910");
  const [route, setRoute] = useState<[number, number][]>([]);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async () => {
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

    if (data.route?.coordinates) {
      const formatted = data.route.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng],
      );
      console.log("Formatted route:", formatted.slice(0, 3));
      setRoute(formatted);
    }

    setResult(data);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Anti-Pollution Route Planner</h1>

      <div>
        <input value={origin} onChange={(e) => setOrigin(e.target.value)} />
        <input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        />
        <button onClick={handleSubmit}>Get Route</button>
      </div>

      {result && (
        <div>
          <p>Distance: {result.distance_km} km</p>
          <p>Duration: {result.duration_min} min</p>
          <p>Exposure Score: {result.exposure_score}</p>
        </div>
      )}

      <MapWithRoute route={route} />
    </div>
  );
}
