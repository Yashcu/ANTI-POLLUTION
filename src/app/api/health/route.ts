import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function GET() {
    try {
        await redis.ping();

        return NextResponse.json({
            status: "ok",
            redis: "connected",
            pollution_engine: "not_initialized"
        });
    } catch (error: any) {
        return NextResponse.json(
            { status: "error", message: error.message },
            { status: 500 }
        );
    }
}
