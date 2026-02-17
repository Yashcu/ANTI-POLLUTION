"use client";

import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Props = {
  route: [number, number][];
};

function FitBounds({ route }: Props) {
  const map = useMap();

  useEffect(() => {
    if (route.length > 0) {
      map.fitBounds(route, { padding: [50, 50] });
    }
  }, [route, map]);

  return null;
}

// Custom CSS-based icons for a cleaner look
const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background-color: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 4px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const startIcon = createCustomIcon("#22c55e"); // Green
const endIcon = createCustomIcon("#ef4444");   // Red

// Force map to recalculate size when container changes (fixes gray tile issues)
function MapResizer() {
  const map = useMap();

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });

    // Oberve the map container
    const container = map.getContainer();
    resizeObserver.observe(container);

    // Also force a check after a small delay to handle initial layout shifts
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      resizeObserver.disconnect();
    };
  }, [map]);

  return null;
}

export default function MapWithRoute({ route }: Props) {
  const start = route[0];
  const end = route[route.length - 1];

  return (
    <MapContainer
      center={[28.6139, 77.209]}
      zoom={12}
      maxZoom={18}
      className="h-full w-full z-0"
    >
      <MapResizer />
      <TileLayer
        attribution='Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
      />

      {route.length > 0 && (
        <>
          <Polyline
            positions={route}
            pathOptions={{
              color: "#6366f1", // Indigo-500
              weight: 6,
              opacity: 0.8,
              lineCap: 'round',
              lineJoin: 'round'
            }}
          />

          {start && (
            <Marker position={start} icon={startIcon}>
              <Popup className="font-sans font-medium">Start Point</Popup>
            </Marker>
          )}

          {end && (
            <Marker position={end} icon={endIcon}>
              <Popup className="font-sans font-medium">Destination</Popup>
            </Marker>
          )}

          <FitBounds route={route} />
        </>
      )}
    </MapContainer>
  );
}
