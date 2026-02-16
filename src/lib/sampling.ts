export function sampleRoutePoints(
    coordinates: number[][],
    maxPoints = 20
): number[][] {
    const total = coordinates.length;

    if (total <= maxPoints) {
        return coordinates.map(([lng, lat]) => [lat, lng]);
    }

    const step = Math.floor(total / maxPoints);
    const sampled: number[][] = [];

    for (let i = 0; i < total; i += step) {
        const [lng, lat] = coordinates[i];
        sampled.push([lat, lng]); // convert to [lat, lng]
    }

    return sampled;
}
