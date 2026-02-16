import { NextResponse } from "next/server";
import { sampleRoutePoints } from "@/lib/sampling";
import { calculateRouteExposure } from "@/lib/pollution";
import { redis } from "@/lib/redis";
import { routeSchema } from "@/lib/validation";

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

    const cacheKey = `route:${origin[0]}:${origin[1]}:${destination[0]}:${destination[1]}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log("CACHE HIT");
      return NextResponse.json(cached);
    }

    console.time("ORS");
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
    console.timeEnd("ORS");

    if (!orsResponse.ok) {
      return NextResponse.json(
        { error: "Routing service unavailable" },
        { status: 502 },
      );
    }

    const data = await orsResponse.json();
    console.log("Routes returned:", data.features.length);

    const routes = data.features;

    const exposureLabel = `EXPOSURE_${Date.now()}`;
    console.time(exposureLabel);
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
          route: feature.geometry,
        };
      }),
    );
    console.timeEnd(exposureLabel);

    const responsePayload = {
      routes: results,
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
