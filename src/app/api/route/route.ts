import { NextResponse } from "next/server";
import { sampleRoutePoints } from "@/lib/sampling";
import { calculateRouteExposure } from "@/lib/pollution";
import { redis } from "@/lib/redis";
import { routeSchema } from "@/lib/validation";
import { classifyAQI } from "@/lib/aqi";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = routeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }
    const { origin, destination } = parsed.data;

    // // Rate Limiting
    // const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    // const requestCount = await rateLimit(ip);
    // if (requestCount > 20) {
    //     return NextResponse.json(
    //         { error: "Too many requests. Try again later." },
    //         { status: 429 },
    //     );
    // }

    const round = (num: number) => Number(num.toFixed(4));
    const cacheKey = `route:${round(origin[0])}:${round(origin[1])}:${round(destination[0])}:${round(destination[1])}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Call OpenRouteService
    const orsResponse = await fetch(
      "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
      {
        method: "POST",
        headers: {
          Authorization: process.env.ORS_API_KEY!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coordinates: [
            [origin[1], origin[0]],
            [destination[1], destination[0]],
          ],
          alternative_routes: {
            target_count: 2,
            share_factor: 0.6,
          },
        }),
      },
    );

    if (!orsResponse.ok) {
      return NextResponse.json(
        { error: "Routing service unavailable" },
        { status: 502 },
      );
    }

    const data = await orsResponse.json();

    const routes = data.features;

    const exposureLabel = `EXPOSURE_${Date.now()}`;
    const results = await Promise.all(
      routes.map(async (feature: any) => {
        const distanceKm = feature.properties.summary.distance / 1000;
        const durationMin = feature.properties.summary.duration / 60;

        const coordinates = feature.geometry.coordinates;
        const sampledPoints = sampleRoutePoints(coordinates, 20);

        const exposure = await calculateRouteExposure(sampledPoints);

        return {
          distance_km: Number(distanceKm.toFixed(2)),
          duration_min: Number(durationMin.toFixed(2)),
          exposure_score: Number(exposure.toFixed(2)),
          risk_level: classifyAQI(exposure),
          route: feature.geometry,
        };
      }),
    );

    //Find fastest
    const fastest = results.reduce((prev, curr) =>
      curr.duration_min < prev.duration_min ? curr : prev,
    );

    // Find cleanest
    const cleanest = results.reduce((prev, curr) =>
      curr.exposure_score < prev.exposure_score ? curr : prev,
    );

    // Add flags
    const enhancedResults = results.map((route) => ({
      ...route,
      is_fastest: route === fastest,
      is_cleanest: route === cleanest,
    }));

    const responsePayload = {
      routes: enhancedResults,
    };
    // Save to Redis (20 min TTL)
    await redis.set(cacheKey, responsePayload, {
      ex: 60 * 20,
    });

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
