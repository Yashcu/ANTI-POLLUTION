import { buildColoredSegmentsFromDetails } from "../mapHelpers";
import { describe, it, expect } from "vitest";

describe("buildColoredSegmentsFromDetails", () => {
    it("should group adjacent points of the same AQI band into one segment", () => {
        const details = [
            { lat: 1, lng: 1, aqi: 40 }, // Good (Green)
            { lat: 2, lng: 2, aqi: 45 }, // Good (Green)
            { lat: 3, lng: 3, aqi: 150 } // Unhealthy (Red)
        ];

        const segments = buildColoredSegmentsFromDetails(details);

        // Should result in 2 segments (one green, one orange/red based on mapping)
        expect(segments).toHaveLength(2);
        expect(segments[0].color).toBe("#22c55e"); // Green
    });
});
