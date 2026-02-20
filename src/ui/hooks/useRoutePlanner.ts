import { useState } from "react";
import { geocode, fetchRoutes } from "@/ui/api";
import { RouteModel } from "@/shared/types/route";
import { GridMeta } from "@/modules/routing/types";
import { isInsideChandigarh } from "@/domain/city";

type Status = "idle" | "loading" | "success" | "error";

export function useRoutePlanner() {
    const [origin, setOrigin] = useState("Sector 17");
    const [destination, setDestination] = useState("Sector 22");
    const [routes, setRoutes] = useState<RouteModel[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [gridMeta, setGridMeta] = useState<GridMeta | null>(null);
    const [status, setStatus] = useState<Status>("idle");
    const [error, setError] = useState<string | null>(null);

    const calculateRoute = async () => {
        try {
            setStatus("loading");
            setError(null);

            const originData = await geocode(origin);
            const destData = await geocode(destination);

            if (!isInsideChandigarh(originData.lat, originData.lng) || !isInsideChandigarh(destData.lat, destData.lng)) {
                throw new Error("Routing is currently supported only within Chandigarh city limits.");
            }

            const response = await fetchRoutes([originData.lat, originData.lng], [destData.lat, destData.lng]);

            setRoutes(response.routes);
            setGridMeta(response.grid_meta);
            setSelectedIndex(response.routes.findIndex((r) => r.is_selected) >= 0 ? response.routes.findIndex((r) => r.is_selected) : 0);
            setStatus("success");
        } catch (err) {
            setStatus("error");
            setError(err instanceof Error ? err.message : "Failed to calculate route");
        }
    };

    return {
        state: { origin, destination, routes, selectedIndex, hoveredIndex, gridMeta, status, error },
        actions: { setOrigin, setDestination, setSelectedIndex, setHoveredIndex, calculateRoute }
    };
}
