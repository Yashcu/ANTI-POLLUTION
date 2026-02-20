import { describe, it, expect } from "vitest";
import { haversineDistance } from "../geo";

describe("haversineDistance", () => {
    it("returns 0 for the same point", () => {
        const d = haversineDistance(30.74, 76.77, 30.74, 76.77);
        expect(d).toBe(0);
    });

    it("computes a known distance within Chandigarh", () => {
        // Sector 17 (~30.7415, 76.7787) to Sector 35 (~30.7235, 76.7600)
        const d = haversineDistance(30.7415, 76.7787, 30.7235, 76.7600);

        // Should be roughly 2.5 km (±500m tolerance)
        expect(d).toBeGreaterThan(2000);
        expect(d).toBeLessThan(3000);
    });

    it("is symmetric", () => {
        const d1 = haversineDistance(30.74, 76.77, 30.68, 76.83);
        const d2 = haversineDistance(30.68, 76.83, 30.74, 76.77);

        expect(d1).toBeCloseTo(d2, 6);
    });
});
