import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { routeSchema } from "@/modules/routing/validation";
import { isInsideChandigarh } from "@/domain/city";
import { getPollutionGrid } from "@/modules/grid/gridService";
import { evaluateRoutes } from "@/modules/routing/routeService";
import { scoreRoutes } from "@/domain/scoring";
import { AppError } from "@/shared/errors/AppError";
import { respondError } from "@/shared/http/respondError";
import { buildRouteCacheKey, getCachedRoute, setCachedRoute } from "@/modules/routing/routeCache";
import { logInfo, logError } from "@/infrastructure/logger";
import { redis } from "@/infrastructure/redis";
import { requestContext } from "@/infrastructure/requestContext";
import { randomUUID } from "crypto";

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "60 s"),
  analytics: true,
});

export async function POST(req: Request) {
  const requestId = req.headers.get("x-request-id") ?? randomUUID();

  return requestContext.run({ requestId }, async () => {
    try {
      const requestStart = Date.now();
      logInfo("route_request_start", { requestId });

      // Rate Limiting — sliding window, 20 req/min per IP
      const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
      const { success } = await ratelimit.limit(ip);

      if (!success) {
        return NextResponse.json(
          { error: "Too many requests" },
          { status: 429 }
        );
      }

      const body = await req.json();
      const parsed = routeSchema.safeParse(body);
      if (!parsed.success) {
        throw new AppError(
          parsed.error.issues[0].message,
          400,
          "INVALID_INPUT"
        );
      }
      const origin = parsed.data.origin as [number, number];
      const destination = parsed.data.destination as [number, number];

      if (
        !isInsideChandigarh(origin[0], origin[1]) ||
        !isInsideChandigarh(destination[0], destination[1])
      ) {
        throw new AppError(
          "Routing supported only within Chandigarh city limits",
          400,
          "OUTSIDE_CHANDIGARH"
        );
      }

      const cacheKey = buildRouteCacheKey(origin, destination);
      const cached = await getCachedRoute(cacheKey);
      if (cached) {
        logInfo("route_cache_hit", { requestId });
        return NextResponse.json({
          ...cached,
          metrics: {
            total_processing_ms: Date.now() - requestStart,
            ors_latency_ms: 0
          }
        }, {
          headers: { "x-request-id": requestId },
        });
      }

      // Fetch grid ONCE per request (Phase 3 optimization)
      const { grid, status, ageMinutes } = await getPollutionGrid();

      if (status === "stale") {
        throw new AppError(
          "Pollution data unavailable or stale",
          503,
          "GRID_STALE",
          { age_minutes: ageMinutes }
        );
      }

      const { routes: results, orsLatency } =
        await evaluateRoutes({ origin, destination, grid });

      const enhancedResults = scoreRoutes(results);

      const totalTimeMs = Date.now() - requestStart;

      const responsePayload = {
        routes: enhancedResults,
        grid_meta: {
          status: status,
          age_minutes: ageMinutes,
          last_updated: new Date(Date.now() - (ageMinutes || 0) * 60000).toISOString(),
          freshness_minutes: ageMinutes || 0,
          interpolation: "idw",
          source: "cpcb"
        },
        metrics: {
          total_processing_ms: totalTimeMs,
          ors_latency_ms: orsLatency
        }
      };

      logInfo("route_request_completed", {
        route_count: enhancedResults.length,
        grid_status: status,
        grid_age_minutes: ageMinutes,
        processing_time_ms: totalTimeMs,
        ors_latency_ms: orsLatency
      });

      // Save to Redis (20 min TTL)
      await setCachedRoute(cacheKey, responsePayload);

      return NextResponse.json(responsePayload, {
        headers: { "x-request-id": requestId },
      });
    } catch (error) {
      logError("route_failure", error);
      return respondError(error);
    }
  });
}
