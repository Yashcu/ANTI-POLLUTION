import { NextResponse } from "next/server";
import { getChandigarhStations } from "@/modules/pollution/cpcbClient";
import { estimatePollution } from "@/modules/grid/interpolation";
import { withInternalAuth } from "@/shared/http/withInternalAuth";
import { respondError } from "@/shared/http/respondError";

export const GET = withInternalAuth(async () => {
    try {
        const { stations, quality } = await getChandigarhStations();

        const testValue = estimatePollution(
            30.740000,
            76.770000,
            stations
        );

        return NextResponse.json({
            count: stations.length,
            quality,
            sample: stations.slice(0, 2),
            testInterpolation: testValue
        });
    } catch (error) {
        return respondError(error);
    }
});

