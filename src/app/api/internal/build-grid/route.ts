import { buildPollutionGrid, getGridStatus } from "@/modules/grid/gridService";
import { NextResponse } from "next/server";
import { withInternalAuth } from "@/shared/http/withInternalAuth";

export const GET = withInternalAuth(async () => {
    const result = await buildPollutionGrid();
    const status = await getGridStatus();

    return NextResponse.json({
        ...result,
        gridStatus: status,
    });
});
