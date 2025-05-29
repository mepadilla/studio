
import type { PumpSeriesData, PumpModelData } from './pump-data.types';

// Datos de las series de bombas Panelli
export const P95PR08_DATA: PumpSeriesData = {
  seriesName: "95PR08",
  flowRateUnit: "l/s",
  pressureUnit: "metros",
  minFlow: 0,
  maxFlow: 0.7,
  flowRates: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7],
  models: [
    { modelName: "95PR0806", hp: "0.5", pressures: [51, 48, 45, 42, 38, 34, 28] },
    { modelName: "95PR0809", hp: "0.75", pressures: [77, 72, 68, 63, 57, 51, 42] },
    { modelName: "95PR0813", hp: "1", pressures: [111, 104, 98, 90, 83, 73, 61] },
    { modelName: "95PR0819", hp: "1.5", pressures: [162, 153, 144, 132, 121, 107, 89] },
    { modelName: "95PR0825", hp: "2", pressures: [213, 201, 189, 174, 159, 141, 117] },
    { modelName: "95PR0837", hp: "3", pressures: [315, 297, 280, 257, 235, 208, 173] },
  ],
};

export const P95PR15_DATA: PumpSeriesData = {
  seriesName: "95PR15",
  flowRateUnit: "l/s",
  pressureUnit: "metros",
  minFlow: 0.4,
  maxFlow: 1.2,
  flowRates: [0.4, 0.6, 0.8, 1.0, 1.2],
  models: [
    { modelName: "95PR1506", hp: "0.75", pressures: [51, 46, 39, 29, 15] },
    { modelName: "95PR1509", hp: "1", pressures: [76, 69, 58, 43, 22] },
    { modelName: "95PR1513", hp: "1.5", pressures: [110, 99, 84, 62, 32] },
    { modelName: "95PR1517", hp: "2", pressures: [144, 130, 110, 81, 41] },
    { modelName: "95PR1525", hp: "3", pressures: [212, 191, 162, 119, 61] },
  ],
};

export const P95PR20_DATA: PumpSeriesData = {
  seriesName: "95PR20",
  flowRateUnit: "l/s",
  pressureUnit: "metros",
  minFlow: 0.4,
  maxFlow: 1.8,
  flowRates: [0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8],
  models: [
    { modelName: "95PR2004", hp: "0.75", pressures: [35, 33, 32, 29, 25, 21, 17, 11] },
    { modelName: "95PR2006", hp: "1", pressures: [52, 50, 48, 43, 38, 31, 25, 16] },
    { modelName: "95PR2009", hp: "1.5", pressures: [78, 75, 71, 65, 57, 47, 37, 24] },
    { modelName: "95PR2012", hp: "2", pressures: [104, 99, 95, 86, 76, 63, 50, 32] },
    { modelName: "95PR2018", hp: "3", pressures: [156, 149, 143, 130, 113, 94, 75, 49] },
    { modelName: "95PR2033", hp: "5.5", pressures: [285, 273, 261, 238, 208, 172, 137, 89] },
  ],
};

export const P95PR25_DATA: PumpSeriesData = {
  seriesName: "95PR25",
  flowRateUnit: "l/s",
  pressureUnit: "metros",
  minFlow: 0.8,
  maxFlow: 2.0,
  flowRates: [0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0],
  models: [
    { modelName: "95PR2503", hp: "0.75", pressures: [28, 27, 24, 22, 19, 17, 13] },
    { modelName: "95PR2505", hp: "1", pressures: [47, 44, 41, 37, 32, 28, 22] },
    { modelName: "95PR2507", hp: "1.5", pressures: [66, 62, 57, 52, 45, 39, 30] },
    { modelName: "95PR2509", hp: "2", pressures: [84, 80, 73, 67, 58, 50, 39] },
    { modelName: "95PR2514", hp: "3", pressures: [131, 124, 114, 104, 91, 77, 60] },
    { modelName: "95PR2525", hp: "5.5", pressures: [234, 222, 204, 186, 162, 138, 108] },
    { modelName: "95PR2534", hp: "7.5", pressures: [318, 302, 277, 253, 220, 187, 147] },
  ],
};

export const P95PR35_DATA: PumpSeriesData = {
  seriesName: "95PR35",
  flowRateUnit: "l/s",
  pressureUnit: "metros",
  minFlow: 0.8,
  maxFlow: 3.2,
  flowRates: [0.8, 1.2, 1.6, 2.0, 2.4, 2.8, 3.2],
  models: [
    { modelName: "95PR3503", hp: "0.75", pressures: [26, 25, 24, 21, 18, 14, 11] },
    { modelName: "95PR3504", hp: "1", pressures: [35, 33, 32, 27, 24, 19, 14] },
    { modelName: "95PR3505", hp: "1.5", pressures: [43, 41, 40, 34, 31, 23, 18] },
    { modelName: "95PR3507", hp: "2", pressures: [60, 58, 55, 48, 43, 33, 25] },
    { modelName: "95PR3511", hp: "3", pressures: [95, 91, 87, 75, 67, 51, 40] },
    { modelName: "95PR3520", hp: "5.5", pressures: [173, 166, 158, 137, 122, 94, 72] },
    { modelName: "95PR3527", hp: "7.5", pressures: [233, 224, 214, 185, 165, 126, 97] },
  ],
};

export const P95PR45_DATA: PumpSeriesData = {
  seriesName: "95PR45",
  flowRateUnit: "l/s",
  pressureUnit: "metros",
  minFlow: 1.6,
  maxFlow: 4.0,
  flowRates: [1.6, 2.0, 2.4, 2.8, 3.2, 3.6, 4.0],
  models: [
    { modelName: "95PR4504", hp: "1.5", pressures: [36, 33, 32, 29, 24, 20, 14] },
    { modelName: "95PR4505", hp: "2", pressures: [45, 41, 40, 36, 31, 25, 18] },
    { modelName: "95PR4507", hp: "3", pressures: [63, 58, 55, 50, 43, 35, 25] },
    { modelName: "95PR4513", hp: "5.5", pressures: [117, 108, 103, 94, 80, 66, 47] },
    { modelName: "95PR4518", hp: "7.5", pressures: [162, 149, 143, 130, 110, 91, 65] },
  ],
};

export const P95PR55_DATA: PumpSeriesData = {
  seriesName: "95PR55",
  flowRateUnit: "l/s",
  pressureUnit: "metros",
  minFlow: 2.0,
  maxFlow: 5.0,
  flowRates: [2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0],
  models: [
    { modelName: "95PR5503", hp: "1.5", pressures: [24, 22, 21, 18, 16, 12, 9] },
    { modelName: "95PR5504", hp: "2", pressures: [32, 30, 28, 24, 21, 16, 12] },
    { modelName: "95PR5506", hp: "3", pressures: [48, 45, 41, 36, 31, 24, 17] },
    { modelName: "95PR5511", hp: "5.5", pressures: [89, 82, 76, 66, 57, 44, 32] },
    { modelName: "95PR5516", hp: "7.5", pressures: [129, 120, 111, 97, 83, 64, 46] },
    { modelName: "95PR5522", hp: "10", pressures: [177, 165, 152, 133, 114, 89, 63] },
  ],
};

export const P95PR75_DATA: PumpSeriesData = {
  seriesName: "95PR75",
  flowRateUnit: "l/s",
  pressureUnit: "metros",
  minFlow: 3.0,
  maxFlow: 6.0,
  flowRates: [3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0],
  models: [
    { modelName: "95PR7502", hp: "1.5", pressures: [15, 14, 13, 12, 11, 9, 7] },
    { modelName: "95PR7503", hp: "2", pressures: [23, 22, 19, 18, 16, 13, 11] },
    { modelName: "95PR7505", hp: "3", pressures: [38, 36, 32, 31, 27, 22, 18] },
    { modelName: "95PR7508", hp: "5.5", pressures: [60, 58, 52, 49, 43, 35, 29] },
    { modelName: "95PR7512", hp: "7.5", pressures: [91, 86, 78, 73, 65, 52, 43] },
    { modelName: "95PR7516", hp: "10", pressures: [121, 115, 104, 98, 86, 69, 58] },
  ],
};

export const P95PR95_DATA: PumpSeriesData = {
  seriesName: "95PR95",
  flowRateUnit: "l/s",
  pressureUnit: "metros",
  minFlow: 3.0,
  maxFlow: 8.0,
  flowRates: [3.0, 4.0, 5.0, 6.0, 7.0, 8.0],
  models: [
    { modelName: "95PR9505", hp: "3", pressures: [36, 33, 30, 25, 19, 13] },
    { modelName: "95PR9508", hp: "5.5", pressures: [72, 66, 60, 49, 37, 27] },
    { modelName: "95PR9512", hp: "7.5", pressures: [94, 86, 77, 64, 48, 35] },
    { modelName: "95PR9516", hp: "10", pressures: [130, 119, 107, 89, 67, 48] },
  ],
};

export const allPumpSeries: PumpSeriesData[] = [
  P95PR08_DATA,
  P95PR15_DATA,
  P95PR20_DATA,
  P95PR25_DATA,
  P95PR35_DATA,
  P95PR45_DATA,
  P95PR55_DATA,
  P95PR75_DATA,
  P95PR95_DATA,
];
