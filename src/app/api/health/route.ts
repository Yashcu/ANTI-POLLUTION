import { NextResponse } from "next/server";
import { getGridStatus } from "@/lib/grid";

export async function GET() {
    const gridStatus = await getGridStatus();

    return NextResponse.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        grid: gridStatus
    });
}
