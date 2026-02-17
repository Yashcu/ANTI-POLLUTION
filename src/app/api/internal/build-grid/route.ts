import { NextResponse } from "next/server";
import { buildPollutionGrid } from "@/lib/grid";

export async function GET() {
    try {
        const result = await buildPollutionGrid();
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
