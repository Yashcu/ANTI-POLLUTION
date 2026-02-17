import { NextResponse } from "next/server";
import { getChandigarhStations } from "@/lib/cpcb";

export async function GET() {
    try {
        const stations = await getChandigarhStations();

        return NextResponse.json({
            count: stations.length,
            sample: stations.slice(0, 2),
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
