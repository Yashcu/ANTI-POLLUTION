import { buildPollutionGrid, getGridStatus } from "@/lib/grid";
import { NextResponse } from "next/server";

export async function GET() {
    const result = await buildPollutionGrid();
    const status = await getGridStatus();

    return NextResponse.json({
        ...result,
        gridStatus: status,
    });
}
