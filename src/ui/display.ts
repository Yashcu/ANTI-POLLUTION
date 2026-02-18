import { RiskLevel } from "@/shared/types/route";

export function getRouteColor(risk: RiskLevel): string {
    switch (risk) {
        case "Good":
            return "#22c55e";
        case "Moderate":
            return "#eab308";
        case "Unhealthy for Sensitive Groups":
            return "#f97316";
        case "Unhealthy":
        case "Very Unhealthy":
            return "#ef4444";
        default:
            return "#6366f1";
    }
}
