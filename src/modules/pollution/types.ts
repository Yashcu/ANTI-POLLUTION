/** Raw record shape from the CPCB data.gov.in API */
export interface CPCBRecord {
    latitude: string;
    longitude: string;
    avg_value: string;
    last_update: string;
    station: string;
    city: string;
    state: string;
    pollutant_id: string;
}

export interface CPCBApiResponse {
    records: CPCBRecord[];
    total: number;
    count: number;
}

export interface Station {
    lat: number;
    lng: number;
    value: number;
    lastUpdate: string;
}
