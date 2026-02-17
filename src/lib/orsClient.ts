export async function fetchWithRetry(
    url: string,
    options: RequestInit,
    retries = 2,
    timeoutMs = 4000
): Promise<Response> {
    for (let attempt = 0; attempt <= retries; attempt++) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
            });

            clearTimeout(id);

            if (response.ok) {
                return response;
            }

            // Retry only on 5xx
            if (response.status >= 500 && attempt < retries) {
                const backoff = Math.pow(2, attempt) * 300;
                const jitter = Math.random() * 200;
                await new Promise(r => setTimeout(r, backoff + jitter));
                continue;
            }

            return response;

        } catch (err) {
            clearTimeout(id);

            if (attempt < retries) {
                const backoff = Math.pow(2, attempt) * 300;
                const jitter = Math.random() * 200;
                await new Promise(r => setTimeout(r, backoff + jitter));
                continue;
            }

            throw err;
        }
    }

    throw new Error("ORS fetch failed after retries");
}
