import { z } from "zod";

export const routeSchema = z.object({
  origin: z
    .array(z.number())
    .length(2)
    .refine(([lat, lng]) => lat >= -90 && lat <= 90, {
      message: "Invalid latitude in origin",
    })
    .refine(([lat, lng]) => lng >= -180 && lng <= 180, {
      message: "Invalid longitude in origin",
    }),

  destination: z
    .array(z.number())
    .length(2)
    .refine(([lat, lng]) => lat >= -90 && lat <= 90, {
      message: "Invalid latitude in destination",
    })
    .refine(([lat, lng]) => lng >= -180 && lng <= 180, {
      message: "Invalid longitude in destination",
    }),
});
