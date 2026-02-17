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
  color?: string; // Optional prop to color the route
};

function FitBounds({ route }: Props) {
  const map = useMap();

  useEffect(() => {
    // Function to calculate and fit bounds
    const adjustMapView = () => {
      if (route.length > 0) {
        // Check window width to adjust padding for the floating sidebar
        const isDesktop = window.innerWidth >= 768;
        // Leaflet padding is [x, y] -> [left, top] for paddingTopLeft
        const paddingLeft = isDesktop ? 450 : 20;

        map.flyToBounds(route, {
          paddingTopLeft: [paddingLeft, 50],  // [x, y] -> 450px from Left, 50px from Top
          paddingBottomRight: [50, 50],       // [x, y] -> 50px from Right, 50px from Bottom
          maxZoom: 14,
          animate: true,
          duration: 1.5 // Slightly slower for better visual effect
        });
      }
    };

    // Initial adjustment
    adjustMapView();

    // Re-adjust on resize
    const handleResize = () => {
      map.invalidateSize();
      adjustMapView();
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [route, map]);

  return null;
}

// Custom SVG Icons
const createCustomIcon = (color: string) => {
  const svgIcon = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="36px" height="36px" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>`;

  return L.divIcon({
    className: "custom-pin-marker",
    html: svgIcon,
    iconSize: [36, 36],
    iconAnchor: [18, 36], // Bottom tip of the pin
    popupAnchor: [0, -36],
  });
};

const startIcon = createCustomIcon("#22c55e"); // Green
const endIcon = createCustomIcon("#ef4444");   // Red

// Force map to recalculate size when container changes
function MapResizer() {
  const map = useMap();

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });

    const container = map.getContainer();
    resizeObserver.observe(container);

    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      resizeObserver.disconnect();
    };
  }, [map]);

  return null;
}

export default function MapWithRoute({ route, color = "#6366f1" }: Props) {
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
      {/* Light / Silver Map Style */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      {route.length > 0 && (
        <>
          <Polyline
            positions={route}
            pathOptions={{
              color: color, // Use dynamic color
              weight: 6,    // Thicker line
              opacity: 0.9,
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
