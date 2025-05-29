
import type { PumpSeriesData } from './pump-data.types';
import { allPumpSeries as panelliPumpSeries } from './panelli-data';

// Instructions for adding a new brand:
// 1. Create a new file e.g., src/lib/pump-data/newbrand-data.ts
// 2. In that file, define and export your PumpSeriesData array, e.g.:
//    `export const allNewBrandPumpSeries: PumpSeriesData[] = [ ... ];`
// 3. Import it here:
//    `import { allPumpSeries as newBrandPumpSeries } from './newbrand-data';`
// 4. Add a new entry to the ALL_BRANDS_DATA array below.

export interface BrandData {
  brandName: string;
  series: PumpSeriesData[];
  defaultFlowUnit: string; // Added for consistency in the "Add Pump" form
  defaultPressureUnit: string; // Added for consistency
}

export const ALL_BRANDS_DATA: BrandData[] = [
  {
    brandName: 'Panelli',
    series: panelliPumpSeries,
    defaultFlowUnit: 'l/s',
    defaultPressureUnit: 'metros',
  },
  // Example for another brand (uncomment and modify when adding actual data)
  // {
  //   brandName: 'Grundfos',
  //   series: grundfosPumpSeries, // Assuming you created grundfos-data.ts and imported it
  //   defaultFlowUnit: 'm3/h',
  //   defaultPressureUnit: 'bar',
  // },
];
