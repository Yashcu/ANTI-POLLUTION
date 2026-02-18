import { NextResponse } from "next/server";
import { withInternalAuth } from "@/shared/http/withInternalAuth";
import { respondError } from "@/shared/http/respondError";
import { runBenchmark } from "@/modules/benchmark/benchmarkRunner";

export const GET = withInternalAuth(async () => {
    try {
        const result = await runBenchmark({
            total: 80,
            batchSize: 1,
            delayMs: 1200,
            pollutionKey: "pollution_load_index",
        });

        return NextResponse.json(result);
    } catch (error) {
        return respondError(error);
    }
});
