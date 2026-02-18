import { NextResponse } from "next/server";
import { env } from "@/shared/env";

/**
 * Defense-in-depth wrapper for internal API routes.
 * Validates `x-internal-token` header before executing the handler.
 * This runs INSIDE the handler as a second layer — middleware is the first.
 */
export function withInternalAuth(
    handler: (req: Request) => Promise<NextResponse>
) {
    return async (req: Request): Promise<NextResponse> => {
        if (req.headers.get("x-internal-token") !== env.INTERNAL_API_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        return handler(req);
    };
}
