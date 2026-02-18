import { NextResponse } from "next/server";
import { withInternalAuth } from "@/shared/http/withInternalAuth";
import { respondError } from "@/shared/http/respondError";
import { runBenchmark } from "@/modules/benchmark/benchmarkRunner";

export const GET = withInternalAuth(async () => {
    try {
        const result = await runBenchmark({
            total: 20,
            batchSize: 3,
            delayMs: 700,
            pollutionKey: "exposure_score",
        });

        return NextResponse.json(result);
    } catch (error) {
        return respondError(error);
    }
});
