import pino from "pino";
import { getRequestId } from "@/infrastructure/requestContext";

const baseLogger = pino({
    level: process.env.LOG_LEVEL || "info",
    formatters: {
        level(label) {
            return { level: label };
        },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
});

export function logInfo(event: string, data?: unknown) {
    baseLogger.info({ requestId: getRequestId(), event, data });
}

export function logError(event: string, data?: unknown) {
    baseLogger.error({ requestId: getRequestId(), event, data });
}

export function logWarn(event: string, data?: unknown) {
    baseLogger.warn({ requestId: getRequestId(), event, data });
}

export default baseLogger;
