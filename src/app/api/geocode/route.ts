import { NextResponse } from "next/server";
import { respondError } from "@/shared/http/respondError";
import { logError } from "@/infrastructure/logger";
import { requestContext } from "@/infrastructure/requestContext";
import { geocode } from "@/modules/geocoding/geocodeService";
import { randomUUID } from "crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/infrastructure/redis";

const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "60 s"),
    analytics: true,
});

export async function POST(req: Request) {
    const requestId = randomUUID();

    return requestContext.run({ requestId }, async () => {
        try {
            const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
            const { success } = await ratelimit.limit(ip);

            if (!success) {
                return NextResponse.json(
                    { error: "Too many requests" },
                    { status: 429 }
                );
            }

            const { query } = await req.json();

            if (!query || typeof query !== "string") {
                return NextResponse.json(
                    { error: "Location query required" },
                    { status: 400 }
                );
            }

            const result = await geocode(query);

            if (!result) {
                return NextResponse.json(
                    { error: "Location not found within Chandigarh city limits" },
                    { status: 404 }
                );
            }

            return NextResponse.json(result, {
                headers: { "x-request-id": requestId },
            });
        } catch (error) {
            logError("geocode_failure", error);
            return respondError(error);
        }
    });
}
