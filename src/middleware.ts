import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
    if (req.nextUrl.pathname.startsWith("/api/internal")) {
        const token = req.headers.get("x-internal-token");

        // Note: Using process.env directly here because Middleware runs on the Edge runtime, 
        // and sometimes Zod validation (your env.ts) can cause edge-runtime build issues.
        if (!token || token !== process.env.INTERNAL_API_SECRET) {
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