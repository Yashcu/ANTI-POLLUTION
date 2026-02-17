import { NextResponse } from "next/server";
import { getChandigarhStations } from "@/lib/cpcb";
import { estimatePollution } from "@/lib/interpolation";

export async function GET() {
    try {
        const stations = await getChandigarhStations();

        const testValue = estimatePollution(
            30.740000,
            76.770000,
            stations
        );

        return NextResponse.json({
            count: stations.length,
            sample: stations.slice(0, 2),
            testInterpolation: testValue
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
