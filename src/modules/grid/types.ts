export type GridData = {
    data: Float32Array;
    latStep: number;
    lngStep: number;
    rows: number;
    cols: number;
};

export type RedisGridPayload = {
    data: string; // Base64 encoded Float32Array
    latStep: number;
    lngStep: number;
    rows: number;
    cols: number;
};
