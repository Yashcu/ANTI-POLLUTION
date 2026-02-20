import { describe, it, expect } from "vitest";
import { estimatePollution } from "../interpolation";
import { Station } from "@/modules/pollution/types";

const stationA: Station = { lat: 30.74, lng: 76.77, value: 100, lastUpdate: "" };
const stationB: Station = { lat: 30.75, lng: 76.78, value: 200, lastUpdate: "" };

describe("estimatePollution", () => {
    it("throws when given no stations", () => {
        expect(() => estimatePollution(30.74, 76.77, [])).toThrow();
    });

    it("returns the station value when very close to it", () => {
        // Within MIN_DISTANCE_METERS (100m)
        const value = estimatePollution(30.74, 76.77, [stationA]);
        expect(value).toBe(100);
    });

    it("returns a value between two stations for a midpoint", () => {
        const midLat = (stationA.lat + stationB.lat) / 2;
        const midLng = (stationA.lng + stationB.lng) / 2;

        const value = estimatePollution(midLat, midLng, [stationA, stationB]);

        expect(value).toBeGreaterThan(100);
        expect(value).toBeLessThan(200);
    });

    it("falls back to average when point is outside all influence radii", () => {
        // Point far from both stations (outside MAX_INFLUENCE_RADIUS of 5km)
        const farLat = 31.0;
        const farLng = 77.0;

        const value = estimatePollution(farLat, farLng, [stationA, stationB]);

        // Should be simple average: (100 + 200) / 2 = 150
        expect(value).toBe(150);
    });
});
