import { renderHook, act } from "@testing-library/react";
import { useRoutePlanner } from "../useRoutePlanner";
import { vi, describe, it, expect } from "vitest";
import * as api from "@/ui/api";

// Mock the API calls
vi.mock("@/ui/api");

describe("useRoutePlanner", () => {
    it("should initialize with default values", () => {
        const { result } = renderHook(() => useRoutePlanner());
        expect(result.current.state.origin).toBe("Sector 17");
        expect(result.current.state.status).toBe("idle");
    });

    it("should set error if outside Chandigarh", async () => {
        // Mock geocode to return a location in Delhi
        vi.mocked(api.geocode).mockResolvedValue({ lat: 28.7041, lng: 77.1025, label: "Delhi" });

        const { result } = renderHook(() => useRoutePlanner());

        await act(async () => {
            await result.current.actions.calculateRoute();
        });

        expect(result.current.state.status).toBe("error");
        expect(result.current.state.error).toContain("within Chandigarh city limits");
    });
});
