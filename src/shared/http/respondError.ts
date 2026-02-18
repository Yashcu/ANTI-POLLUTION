import { NextResponse } from "next/server";
import { AppError } from "@/shared/errors/AppError";

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

    return NextResponse.json(
        {
            error: "Unexpected server error",
            code: "UNEXPECTED_ERROR",
        },
        { status: 500 }
    );
}
