export const CHANDIGARH_BOUNDARY = {
    minLat: 30.68,
    maxLat: 30.77,
    minLng: 76.70,
    maxLng: 76.83,
};

export function isInsideChandigarh(lat: number, lng: number): boolean {
    return (
        lat >= CHANDIGARH_BOUNDARY.minLat &&
        lat <= CHANDIGARH_BOUNDARY.maxLat &&
        lng >= CHANDIGARH_BOUNDARY.minLng &&
        lng <= CHANDIGARH_BOUNDARY.maxLng
    );
}

export const GRID_RESOLUTION_METERS = 500;

export function randomPointInChandigarh(): [number, number] {
    const lat =
        CHANDIGARH_BOUNDARY.minLat +
        Math.random() *
        (CHANDIGARH_BOUNDARY.maxLat -
            CHANDIGARH_BOUNDARY.minLat);

    const lng =
        CHANDIGARH_BOUNDARY.minLng +
        Math.random() *
        (CHANDIGARH_BOUNDARY.maxLng -
            CHANDIGARH_BOUNDARY.minLng);

    return [lat, lng];
}
