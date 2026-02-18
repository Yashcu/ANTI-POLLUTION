import { z } from "zod";

const coordinateSchema = z.union([
  z.tuple([z.number(), z.number()]),
  z.object({ lat: z.number(), lng: z.number() }).transform((val) => [val.lat, val.lng] as [number, number]),
]);

export const routeSchema = z.object({
  origin: coordinateSchema.refine(([lat, lng]) => lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180, {
    message: "Invalid coordinates in origin",
  }),

  destination: coordinateSchema.refine(([lat, lng]) => lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180, {
    message: "Invalid coordinates in destination",
  }),
});
