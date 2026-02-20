import { RiskLevel } from "@/shared/types/route";

export function classifyAQI(value: number): RiskLevel {
  if (value <= 50) return "Good";
  if (value <= 100) return "Moderate";
  if (value <= 150) return "Unhealthy for Sensitive Groups";
  if (value <= 200) return "Unhealthy";
  return "Very Unhealthy";
}
