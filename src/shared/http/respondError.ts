import { NextResponse } from "next/server";
import { AppError } from "@/shared/errors/AppError";
import { logError } from "@/infrastructure/logger";

export function respondError(error: unknown) {
    if (error instanceof AppError) {
        return NextResponse.json(
            {
                error: error.message,
                code: error.code,
                details: error.details ?? null,
            },
            { status: error.statusCode }
        );
    }

    logError("unhandled_error", {
        message: error instanceof Error ? error.message : "Unknown",
        stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
        {
            error: "Unexpected server error",
            code: "UNEXPECTED_ERROR",
        },
        { status: 500 }
    );
}
