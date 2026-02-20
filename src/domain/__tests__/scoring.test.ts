import { describe, it, expect } from "vitest";
import { scoreRoutes, ScorableRoute } from "../scoring";

function makeRoute(overrides: Partial<ScorableRoute> = {}): ScorableRoute {
    return {
        distance_km: 5,
        duration_min: 10,
        pollution_load_index: 100,
        average_pollution: 80,
        risk_level: "Moderate",
        route: { coordinates: [] },
        path_details: [],
        ...overrides,
    };
}

describe("scoreRoutes", () => {
    it("returns empty array for empty input", () => {
        expect(scoreRoutes([])).toEqual([]);
    });

    it("marks the only route as selected", () => {
        const result = scoreRoutes([makeRoute()]);
        expect(result).toHaveLength(1);
        expect(result[0].is_selected).toBe(true);
    });

    it("normalizes values between 0 and 1", () => {
        const routes = [
            makeRoute({ distance_km: 3, pollution_load_index: 50 }),
            makeRoute({ distance_km: 10, pollution_load_index: 200 }),
        ];

        const result = scoreRoutes(routes);

        for (const r of result) {
            expect(r.pollution_norm).toBeGreaterThanOrEqual(0);
            expect(r.pollution_norm).toBeLessThanOrEqual(1);
            expect(r.distance_norm).toBeGreaterThanOrEqual(0);
            expect(r.distance_norm).toBeLessThanOrEqual(1);
        }
    });

    it("selects lower-pollution route when distances are similar", () => {
        const routes = [
            makeRoute({ distance_km: 5, pollution_load_index: 200 }),
            makeRoute({ distance_km: 5.5, pollution_load_index: 50 }),
        ];

        const result = scoreRoutes(routes);
        const selected = result.find(r => r.is_selected);

        expect(selected).toBeDefined();
        expect(selected!.pollution_load_index).toBe(50);
    });

    it("assigns composite_score = 0 to the best route on each axis", () => {
        const routes = [
            makeRoute({ distance_km: 2, pollution_load_index: 10 }),
            makeRoute({ distance_km: 10, pollution_load_index: 300 }),
        ];

        const result = scoreRoutes(routes);
        const best = result.find(r => r.is_selected)!;

        expect(best.composite_score).toBe(0);
    });
});
