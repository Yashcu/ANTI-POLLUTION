"use client";

import { MapContainer, TileLayer, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type Props = {
  route: [number, number][];
};

export default function MapWithRoute({ route }: Props) {
  return (
    <MapContainer
      center={route.length ? route[0] : [28.6139, 77.209]}
      zoom={12}
      style={{ height: "500px", width: "100%" }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {route.length > 0 && <Polyline positions={route} />}
    </MapContainer>
  );
}
