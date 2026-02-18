import { logInfo, logError } from "@/infrastructure/logger";

type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export class CircuitBreaker {
    private state: CircuitState = "CLOSED";
    private failureCount = 0;
    private lastFailureTime = 0;

    constructor(
        private readonly name: string,
        private readonly threshold: number = 5,
        private readonly resetTimeoutMs: number = 30_000
    ) { }

    async execute<T>(fn: () => Promise<T>): Promise<T> {
        if (this.state === "OPEN") {
            if (Date.now() - this.lastFailureTime >= this.resetTimeoutMs) {
                this.state = "HALF_OPEN";
                logInfo("circuit_half_open", { name: this.name });
            } else {
                throw new Error(`Circuit breaker OPEN for ${this.name}`);
            }
        }

        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    private onSuccess() {
        if (this.state === "HALF_OPEN") {
            logInfo("circuit_closed", { name: this.name });
        }
        this.failureCount = 0;
        this.state = "CLOSED";
    }

    private onFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();

        if (this.failureCount >= this.threshold) {
            this.state = "OPEN";
            logError("circuit_opened", {
                name: this.name,
                failures: this.failureCount,
            });
        }
    }
}
