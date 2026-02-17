export function getWayTypeMultiplier(type: number): number {
    switch (type) {
        case 1: return 1.4;   // motorway
        case 2: return 1.25;  // primary
        case 3: return 1.1;   // secondary
        default: return 1;
    }
}
