"use client";

import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import { useEffect, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { RouteModel } from "@/types/route";
import { getRouteColor } from "@/lib/display";

type Props = {
  routes: RouteModel[];
  selectedIndex: number;
};

function FitBounds({ routes }: { routes: RouteModel[] }) {
  const map = useMap();

  useEffect(() => {
    if (!routes.length) return;

    const allCoords = routes.flatMap((r) =>
      r.route.coordinates.map(([lng, lat]) => [lat, lng] as [number, number])
    );

    if (!allCoords.length) return;

    map.flyToBounds(allCoords, {
      paddingTopLeft: [420, 50],
      paddingBottomRight: [50, 50],
      maxZoom: 14,
      animate: true,
      duration: 1.2,
    });
  }, [routes, map]);

  return null;
}

const createCustomIcon = (color: string) =>
  L.divIcon({
    className: "custom-pin-marker",
    html: `
      <svg xmlns="http://www.w3.org/2000/svg" fill="${color}" width="32" height="32" viewBox="0 0 24 24">
        <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z"/>
      </svg>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

const startIcon = createCustomIcon("#22c55e");
const endIcon = createCustomIcon("#ef4444");

export default function MapWithRoute({
  routes,
  selectedIndex,
}: Props) {
  const selectedRoute = routes[selectedIndex];

  const convertedRoutes = useMemo(() => {
    return routes.map((r) =>
      r.route.coordinates.map(
        ([lng, lat]) => [lat, lng] as [number, number]
      )
    );
  }, [routes]);

  return (
    <MapContainer
      center={[28.6139, 77.209]}
      zoom={12}
      maxZoom={18}
      className="h-full w-full"
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      {convertedRoutes.map((coords, index) => {
        const route = routes[index];
        const isSelected = index === selectedIndex;

        return (
          <Polyline
            key={index}
            positions={coords}
            pathOptions={{
              color: getRouteColor(route.risk_level),
              weight: isSelected ? 6 : 4,
              opacity: isSelected ? 0.95 : 0.35,
            }}
          />
        );
      })}

      {selectedRoute && (
        <>
          <Marker
            position={[
              selectedRoute.route.coordinates[0][1],
              selectedRoute.route.coordinates[0][0],
            ]}
            icon={startIcon}
          >
            <Popup>Start</Popup>
          </Marker>

          <Marker
            position={[
              selectedRoute.route.coordinates.slice(-1)[0][1],
              selectedRoute.route.coordinates.slice(-1)[0][0],
            ]}
            icon={endIcon}
          >
            <Popup>Destination</Popup>
          </Marker>
        </>
      )}

      <FitBounds routes={routes} />
    </MapContainer>
  );
}
