import { z } from "zod";

const schema = z.object({
    ORS_API_KEY: z.string().min(1),
    CPCB_API_KEY: z.string().min(1),
    UPSTASH_REDIS_REST_URL: z.string().url(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
    INTERNAL_API_SECRET: z.string().min(16),
    NEXT_PUBLIC_BASE_URL: z.string().url(),
});

export const env = schema.parse(process.env);
