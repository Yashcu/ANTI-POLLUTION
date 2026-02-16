import { supabase } from "@/lib/supabase";

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

