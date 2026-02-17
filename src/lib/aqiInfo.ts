export interface AqiBand {
    label: string;
    min: number;
    max: number;
    color: string;
    healthImpact: string;
}

export const AQI_BANDS: AqiBand[] = [
    {
        label: "Good",
        min: 0,
        max: 50,
        color: "#22c55e",
        healthImpact: "Air quality is satisfactory. Minimal impact."
    },
    {
        label: "Moderate",
        min: 51,
        max: 100,
        color: "#eab308",
        healthImpact: "Acceptable for most. Sensitive individuals may experience minor irritation."
    },
    {
        label: "Unhealthy for Sensitive Groups",
        min: 101,
        max: 150,
        color: "#f97316",
        healthImpact: "People with respiratory issues may experience symptoms."
    },
    {
        label: "Unhealthy",
        min: 151,
        max: 200,
        color: "#ef4444",
        healthImpact: "Everyone may begin to experience health effects."
    },
    {
        label: "Very Unhealthy",
        min: 201,
        max: 500,
        color: "#7f1d1d",
        healthImpact: "Serious health effects. Avoid prolonged exposure."
    }
];
