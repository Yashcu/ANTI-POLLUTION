export type GridCell = {
    lat: number;
    lng: number;
    value: number;
};

export type GridData = {
    cells: GridCell[][];
    latStep: number;
    rows: number;
    cols: number;
};
