export function aqiToColor(aqi: number): string {
    if (aqi <= 50) return "#22c55e";
    if (aqi <= 100) return "#eab308";
    if (aqi <= 150) return "#f97316";
    if (aqi <= 200) return "#ef4444";
    return "#7f1d1d";
}

export interface ColoredSegment {
    positions: [number, number][];
    color: string;
}

export function buildColoredSegmentsFromDetails(
    details: { lat: number; lng: number; aqi: number }[]
): ColoredSegment[] {
    const segments: ColoredSegment[] = [];
    if (!details || details.length < 2) return segments;

    for (let i = 0; i < details.length - 1; i++) {
        const p1 = details[i];
        const p2 = details[i + 1];

        const segmentAqi = Math.round((p1.aqi + p2.aqi) / 2);
        const color = aqiToColor(segmentAqi);

        const last = segments[segments.length - 1];
        if (last && last.color === color) {
            last.positions.push([p2.lat, p2.lng]);
        } else {
            segments.push({
                positions: [[p1.lat, p1.lng], [p2.lat, p2.lng]],
                color,
            });
        }
    }

    return segments;
}

export function findPeakPoint(
    pathDetails: { lat: number; lng: number; aqi: number }[]
): { lat: number; lng: number; aqi: number } | null {
    if (!pathDetails || pathDetails.length === 0) return null;

    let peak = pathDetails[0];
    for (const pt of pathDetails) {
        if (pt.aqi > peak.aqi) peak = pt;
    }
    return peak;
}
