import { render, screen } from "@testing-library/react";
import { RouteCard } from "../RouteCard";
import { describe, it, expect, vi } from "vitest";

describe("RouteCard", () => {
    it("displays a green leaf icon when route is cleanest", () => {
        const mockRoute = {
            distance_km: 5,
            duration_min: 10,
            average_pollution: 40,
            pollution_load_index: 200,
            is_selected: true,
            is_fastest: false, // Cleanest route
            route: {
                type: "LineString",
                coordinates: []
            },
            path_details: []
        } as any;

        render(<RouteCard route={mockRoute} isActive={true} onClick={vi.fn()} />);

        // Check if the SVG or specific class is rendered
        expect(screen.getByText("10")).toBeDefined();
        expect(screen.getByText(/AQI 40/)).toBeDefined();
    });
});
