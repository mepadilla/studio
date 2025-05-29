
export interface PumpModelData {
  modelName: string;
  hp: string;
  pressures: number[]; // Corresponds to the flowRates in PumpSeriesData
}

export interface PumpSeriesData {
  seriesName: string; // E.g., "95PR08"
  flowRateUnit: string; // E.g., "l/s"
  pressureUnit: string; // E.g., "metros"
  minFlow: number;
  maxFlow: number;
  flowRates: number[]; // Header flow rate values
  models: PumpModelData[];
}
