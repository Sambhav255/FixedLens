import type { AssetClassId } from "../types";

export interface PresetDefinition {
  id: string;
  label: string;
  weights: Record<AssetClassId, number>;
}

/** Percentages from PRD §4.2.1 as decimals summing to 1 */
export const PRESETS: PresetDefinition[] = [
  {
    id: "conservative",
    label: "Conservative Income",
    weights: {
      treasury: 0.3,
      ig: 0.3,
      hy: 0.05,
      muni: 0.25,
      tips: 0,
      mbs: 0.1,
    },
  },
  {
    id: "moderate",
    label: "Moderate Growth",
    weights: {
      treasury: 0.2,
      ig: 0.4,
      hy: 0.15,
      muni: 0.15,
      tips: 0.1,
      mbs: 0,
    },
  },
  {
    id: "aggressive",
    label: "Aggressive Duration",
    weights: {
      treasury: 0.1,
      ig: 0.5,
      hy: 0.2,
      muni: 0.1,
      tips: 0.1,
      mbs: 0,
    },
  },
  {
    id: "inflation",
    label: "Inflation Shield",
    weights: {
      treasury: 0.2,
      ig: 0.2,
      hy: 0.05,
      muni: 0.15,
      tips: 0.35,
      mbs: 0.05,
    },
  },
  {
    id: "hy-tilt",
    label: "High Yield Tilt",
    weights: {
      treasury: 0.05,
      ig: 0.2,
      hy: 0.5,
      muni: 0.1,
      tips: 0.05,
      mbs: 0.1,
    },
  },
];
