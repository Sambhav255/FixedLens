import { ASSET_CLASSES } from "../constants/assetClasses";
import type { AssetClassId } from "../types";

/** Weighted duration and portfolio yield from allocation (decimals). */
export function portfolioDurationAndYield(weights: Record<AssetClassId, number>): {
  wad: number;
  portfolioYield: number;
} {
  const wad = ASSET_CLASSES.reduce(
    (s, a) => s + weights[a.id] * a.modifiedDuration,
    0
  );
  const portfolioYield = ASSET_CLASSES.reduce(
    (s, a) => s + weights[a.id] * a.currentYield,
    0
  );
  return { wad, portfolioYield };
}
