"use client";

import {
  MapContainer,
  TileLayer,
  Polyline,
  Polygon,
  Marker,
  Popup,
  Tooltip,
  useMap,
} from "react-leaflet";
import { useEffect, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { RouteModel } from "@/shared/types/route";
import { CHANDIGARH_BOUNDARY } from "@/domain/city";

type Props = {
  routes: RouteModel[];
  selectedIndex: number;
  hoveredIndex: number | null;
};

const CHANDIGARH_CENTER: [number, number] = [30.725, 76.765];

/* ── Inverse Mask ───────────────────────────────────────── */

const WORLD_OUTER: [number, number][] = [
  [-90, -180], [-90, 180], [90, 180], [90, -180], [-90, -180],
];

const CHANDIGARH_HOLE: [number, number][] = [
  [CHANDIGARH_BOUNDARY.minLat, CHANDIGARH_BOUNDARY.minLng],
  [CHANDIGARH_BOUNDARY.minLat, CHANDIGARH_BOUNDARY.maxLng],
  [CHANDIGARH_BOUNDARY.maxLat, CHANDIGARH_BOUNDARY.maxLng],
  [CHANDIGARH_BOUNDARY.maxLat, CHANDIGARH_BOUNDARY.minLng],
  [CHANDIGARH_BOUNDARY.minLat, CHANDIGARH_BOUNDARY.minLng],
];

import { buildColoredSegmentsFromDetails, findPeakPoint } from "./utils/mapHelpers";

/* ── Custom Markers ─────────────────────────────────────── */

/* ── Chandigarh Sector Markers (Minimalist Apple Style) ───── */

const startIcon = L.divIcon({
  className: "chandigarh-pin",
  html: `<div style="
    width: 14px; height: 14px;
    background: white;
    border: 3.5px solid #007AFF; /* Apple Blue */
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const endIcon = L.divIcon({
  className: "chandigarh-pin",
  html: `<div style="
    width: 14px; height: 14px;
    background: white;
    border: 3.5px solid #FF3B30; /* Apple Red */
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

/* ── Custom Map Controls ────────────────────────────────── */

function MapControls() {
  const map = useMap();

  return (
    <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 z-[1000] flex flex-col gap-2">
      <button
        onClick={() => map.zoomIn()}
        className="w-10 h-10 bg-white rounded-xl shadow-md shadow-black/10 flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        aria-label="Zoom In"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="w-10 h-10 bg-white rounded-xl shadow-md shadow-black/10 flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        aria-label="Zoom Out"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
        </svg>
      </button>
      <button
        onClick={() => map.flyTo(CHANDIGARH_CENTER, 13, { duration: 0.8 })}
        className="w-10 h-10 bg-white rounded-xl shadow-md shadow-black/10 flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        aria-label="Recenter Map"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v4m0 12v4m10-10h-4M6 12H2" />
        </svg>
      </button>
    </div>
  );
}

/* ── FitBounds ──────────────────────────────────────────── */

function FitBounds({ routes }: { routes: RouteModel[] }) {
  const map = useMap();

  useEffect(() => {
    if (!routes.length) return;

    const allCoords = routes.flatMap((r) =>
      r.route.coordinates.map(([lng, lat]) => [lat, lng] as [number, number])
    );
    if (!allCoords.length) return;

    map.flyToBounds(allCoords, {
      paddingTopLeft: [60, 50],
      paddingBottomRight: [60, 50],
      maxZoom: 15,
      animate: true,
      duration: 1.2,
    });
  }, [routes, map]);

  return null;
}

/* ── Main Component ─────────────────────────────────────── */

export default function MapWithRoute({ routes, selectedIndex, hoveredIndex }: Props) {
  const selectedRoute = routes[selectedIndex];

  const routeData = useMemo(() => {
    return routes.map((r) => {
      const converted = r.route.coordinates.map(
        ([lng, lat]) => [lat, lng] as [number, number]
      );
      return {
        converted,
        segments: buildColoredSegmentsFromDetails(r.path_details),
      };
    });
  }, [routes]);

  const peakPoint = useMemo(() => {
    if (!selectedRoute) return null;
    return findPeakPoint(selectedRoute.path_details);
  }, [selectedRoute]);

  return (
    <MapContainer
      center={CHANDIGARH_CENTER}
      zoom={13}
      maxZoom={18}
      zoomControl={false}
      attributionControl={false}
      className="h-full w-full"
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      {/* Soft Vignette Mask (Instead of harsh boundary box) */}
      <Polygon
        positions={[WORLD_OUTER, CHANDIGARH_HOLE]}
        pathOptions={{
          fillColor: "#f8fafc", /* Light silver blur overlay */
          fillOpacity: 0.65,
          stroke: false,
        }}
      />

      {/* ── Ghost routes (rendered FIRST so active route is on top) ── */}
      {routeData.map((rd, routeIdx) => {
        if (routeIdx === selectedIndex) return null;

        const isHovered = hoveredIndex === routeIdx;

        return rd.segments.map((seg, segIdx) => (
          <Polyline
            key={`ghost-${routeIdx}-${segIdx}`}
            positions={seg.positions}
            pathOptions={{
              color: seg.color,
              weight: isHovered ? 5 : 4,
              opacity: isHovered ? 0.6 : 0.35, // Faded colors
              dashArray: "8, 10", // Dashed pattern to distinguish from active route
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        ));
      })}

      {/* ── Active route — vibrant, solid colored segments ── */}
      {routeData[selectedIndex]?.segments.map((seg, segIdx) => (
        <Polyline
          key={`active-${segIdx}`}
          positions={seg.positions}
          pathOptions={{
            color: seg.color,
            weight: 6,
            opacity: 1, // Full opacity
            lineCap: "round",
            lineJoin: "round",
          }}
        />
      ))}

      {/* ── Peak Pollution Marker (Minimal Pip) ── */}
      {peakPoint && (
        <Marker
          position={[peakPoint.lat, peakPoint.lng]}
          icon={L.divIcon({
            className: "peak-pip-marker",
            html: `<div style="
              width: 12px; height: 12px;
              background: white;
              border: 2px solid #FF9500;
              border-radius: 50%;
              box-shadow: 0 2px 6px rgba(0,0,0,0.15);
            "></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6],
          })}
        >
          <Tooltip
            permanent
            direction="top"
            offset={[0, -8]}
            opacity={1}
            className="peak-tooltip-minimal"
          >
            <span style={{
              fontFamily: "system-ui, -apple-system, sans-serif",
              fontSize: "11px",
              fontWeight: 600,
              color: "#8F5300", /* Darkened Apple Orange */
              whiteSpace: "nowrap",
            }}>
              Peak AQI {peakPoint.aqi}
            </span>
          </Tooltip>
        </Marker>
      )}

      {/* Start & End markers */}
      {selectedRoute && (
        <>
          <Marker
            position={[
              selectedRoute.route.coordinates[0][1],
              selectedRoute.route.coordinates[0][0],
            ]}
            icon={startIcon}
          >
            <Popup>
              <span className="font-semibold text-slate-800 text-sm">Start</span>
            </Popup>
          </Marker>

          <Marker
            position={[
              selectedRoute.route.coordinates.slice(-1)[0][1],
              selectedRoute.route.coordinates.slice(-1)[0][0],
            ]}
            icon={endIcon}
          >
            <Popup>
              <span className="font-semibold text-slate-800 text-sm">Destination</span>
            </Popup>
          </Marker>
        </>
      )}

      <FitBounds routes={routes} />
      <MapControls />
    </MapContainer>
  );
}
