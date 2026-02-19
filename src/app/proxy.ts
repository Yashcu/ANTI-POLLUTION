import { NextRequest, NextResponse } from "next/server";
import { env } from "@/shared/env";

export function proxy(req: NextRequest) {
    if (req.nextUrl.pathname.startsWith("/api/internal")) {
        const token = req.headers.get("x-internal-token");

        if (!token || token !== env.INTERNAL_API_SECRET) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/api/internal/:path*"],
};
