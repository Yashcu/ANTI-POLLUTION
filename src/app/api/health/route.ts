import { NextResponse } from "next/server";
import { getGridHealth } from "@/modules/grid/gridService";

export async function GET() {
    const health = await getGridHealth();

    return NextResponse.json({
        status: health.status,
        grid_age_minutes: health.grid_age_minutes,
        timestamp: new Date().toISOString(),
    });
}
