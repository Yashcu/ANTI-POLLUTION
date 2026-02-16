import { supabase } from "@/lib/supabase";

export async function getNearestSensorPm25(
    lat: number,
    lng: number
): Promise<number | null> {
    const { data, error } = await supabase.rpc("nearest_sensor_pm25", {
        input_lat: lat,
        input_lng: lng,
    });

    if (error) {
        console.error("Nearest sensor error:", error);
        return null;
    }

    return data ?? null;
}

export async function calculateRouteExposure(
  sampledPoints: number[][]
): Promise<number> {

  const { data, error } = await supabase.rpc(
    "calculate_route_exposure",
    { points: sampledPoints }
  );

  if (error) {
    console.error("Batch exposure error:", error);
    return 0;
  }

  return data ?? 0;
}

