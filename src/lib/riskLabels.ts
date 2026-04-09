import type { AssetClassId } from "../types";

export function creditQualityLabel(weights: Record<AssetClassId, number>): string {
  const hy = weights.hy;
  const ig = weights.ig;
  const govHeavy = weights.treasury + weights.muni + weights.tips;
  if (hy > 0.4) return "Below Investment Grade Tilt";
  if (hy > 0.2) return "Moderate Credit Risk";
  if (hy <= 0.2 && ig > 0.3) return "Investment Grade";
  if (govHeavy > 0.6) return "High Quality / Government-Heavy";
  return "Blended";
}

export type RiskTier = "LOW" | "MODERATE" | "HIGH" | "EXTREME";

export function durationRiskTier(wad: number): RiskTier {
  if (wad < 3) return "LOW";
  if (wad < 6) return "MODERATE";
  if (wad < 9) return "HIGH";
  return "EXTREME";
}

export function creditRiskTier(hyPct: number): RiskTier {
  if (hyPct < 10) return "LOW";
  if (hyPct < 25) return "MODERATE";
  if (hyPct < 40) return "HIGH";
  return "EXTREME";
}

export type ConcentrationTier = "LOW" | "MODERATE" | "HIGH";

export function concentrationRiskTier(weights: Record<AssetClassId, number>): ConcentrationTier {
  const max = Math.max(...Object.values(weights));
  if (max > 0.5) return "HIGH";
  if (max > 0.35) return "MODERATE";
  return "LOW";
}
