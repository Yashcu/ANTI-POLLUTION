import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { origin, destination } = body;

    if (!origin || !destination) {
      return NextResponse.json(
        { error: "Origin and destination required" },
        { status: 400 }
      );
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
            [origin[1], origin[0]],        // ORS expects [lng, lat]
            [destination[1], destination[0]],
          ],
        }),
      }
    );

    if (!orsResponse.ok) {
      const errorText = await orsResponse.text();
      return NextResponse.json(
        { error: errorText },
        { status: orsResponse.status }
      );
    }

    const data = await orsResponse.json();

    const route = data.features[0];

    const distanceKm = route.properties.summary.distance / 1000;
    const durationMin = route.properties.summary.duration / 60;

    const geometry = route.geometry;

    return NextResponse.json({
      distance_km: Number(distanceKm.toFixed(2)),
      duration_min: Number(durationMin.toFixed(2)),
      route: geometry,
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
