export const ASSET_CLASS_IDS = [
  "treasury",
  "ig",
  "hy",
  "muni",
  "tips",
  "mbs",
] as const;

export type AssetClassId = (typeof ASSET_CLASS_IDS)[number];

export type ScenarioCategory = "rate" | "curve" | "credit" | "combined";

export interface AssetClassParams {
  id: AssetClassId;
  label: string;
  modifiedDuration: number;
  convexity: number;
  currentYield: number;
  spreadDuration: number;
  isRateOnly: boolean;
}

export interface Scenario {
  id: string;
  category: ScenarioCategory;
  label: string;
  description: string;
  macroContext: string;
  rateShift: Record<AssetClassId, number>;
  spreadShift: Record<AssetClassId, number>;
}

export interface AllocationMap extends Record<AssetClassId, number> {}
