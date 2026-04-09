import { ASSET_CLASSES } from "../constants/assetClasses";
import type { AssetClassId, Scenario } from "../types";

const DEFAULT_PORTFOLIO_VALUE = 1_000_000;

export interface ComputedRow {
  id: AssetClassId;
  label: string;
  allocation: number;
  duration: number;
  convexity: number;
  priceImpact: number;
  dollarImpact: number;
  contributionPct: number | null;
}

export interface PortfolioComputed {
  wad: number;
  portfolioYield: number;
  portfolioConvexity: number;
  portfolioPriceImpact: number;
  portfolioDollarImpact: number;
  totalReturn: number;
  annualIncome: number;
  reinvestmentYield: number;
  weightedAvgRateDelta: number;
  breakEvenYears: number | null;
  breakEvenDisplay: string | null;
  rows: ComputedRow[];
  worstAsset: { id: AssetClassId; label: string; impact: number };
  effectivePortfolioValue: number;
}

function priceImpactForAsset(
  id: AssetClassId,
  dyRate: number,
  dySpread: number
): number {
  const a = ASSET_CLASSES.find((x) => x.id === id)!;
  const isMbs = id === "mbs";
  const effectiveConvexity =
    isMbs && dyRate < 0 ? a.convexity * 0.6 : a.convexity;
  const ratePart =
    -a.modifiedDuration * dyRate + 0.5 * effectiveConvexity * dyRate * dyRate;
  const spreadPart = a.isRateOnly
    ? 0
    : -a.spreadDuration * dySpread;
  return ratePart + spreadPart;
}

export function computePortfolio(
  weights: Record<AssetClassId, number>,
  portfolioValueRaw: number,
  scenario: Scenario | null
): PortfolioComputed | null {
  const effectivePortfolioValue =
    !Number.isFinite(portfolioValueRaw) || portfolioValueRaw <= 0
      ? DEFAULT_PORTFOLIO_VALUE
      : portfolioValueRaw;

  if (!scenario) {
    const wad = ASSET_CLASSES.reduce(
      (s, a) => s + weights[a.id] * a.modifiedDuration,
      0
    );
    const portfolioYield = ASSET_CLASSES.reduce(
      (s, a) => s + weights[a.id] * a.currentYield,
      0
    );
    const portfolioConvexity = ASSET_CLASSES.reduce(
      (s, a) => s + weights[a.id] * a.convexity,
      0
    );
    return {
      wad,
      portfolioYield,
      portfolioConvexity,
      portfolioPriceImpact: 0,
      portfolioDollarImpact: 0,
      totalReturn: portfolioYield,
      annualIncome: effectivePortfolioValue * portfolioYield,
      reinvestmentYield: portfolioYield,
      weightedAvgRateDelta: 0,
      breakEvenYears: null,
      breakEvenDisplay: null,
      rows: ASSET_CLASSES.map((a) => ({
        id: a.id,
        label: a.label,
        allocation: weights[a.id],
        duration: a.modifiedDuration,
        convexity: a.convexity,
        priceImpact: 0,
        dollarImpact: 0,
        contributionPct: null,
      })),
      worstAsset: {
        id: "treasury",
        label: ASSET_CLASSES[0].label,
        impact: 0,
      },
      effectivePortfolioValue,
    };
  }

  const rows: ComputedRow[] = ASSET_CLASSES.map((a) => {
    const w = weights[a.id];
    const dyR = scenario.rateShift[a.id];
    const dyS = scenario.spreadShift[a.id];
    const pi = priceImpactForAsset(a.id, dyR, dyS);
    const dollar = effectivePortfolioValue * w * pi;
    return {
      id: a.id,
      label: a.label,
      allocation: w,
      duration: a.modifiedDuration,
      convexity: a.convexity,
      priceImpact: pi,
      dollarImpact: dollar,
      contributionPct: null,
    };
  });

  const portfolioPriceImpact = rows.reduce(
    (s, r) => s + r.allocation * r.priceImpact,
    0
  );

  const wad = ASSET_CLASSES.reduce(
    (s, a) => s + weights[a.id] * a.modifiedDuration,
    0
  );
  const portfolioYield = ASSET_CLASSES.reduce(
    (s, a) => s + weights[a.id] * a.currentYield,
    0
  );
  const portfolioConvexity = ASSET_CLASSES.reduce(
    (s, a) => s + weights[a.id] * a.convexity,
    0
  );

  const portfolioDollarImpact =
    effectivePortfolioValue * portfolioPriceImpact;
  const totalReturn = portfolioPriceImpact + portfolioYield;
  const annualIncome = effectivePortfolioValue * portfolioYield;

  const weightedAvgRateDelta = ASSET_CLASSES.reduce(
    (s, a) => s + weights[a.id] * scenario.rateShift[a.id],
    0
  );
  const reinvestmentYield = portfolioYield + weightedAvgRateDelta;

  for (const r of rows) {
    if (portfolioPriceImpact === 0) {
      r.contributionPct = null;
    } else {
      r.contributionPct =
        ((r.allocation * r.priceImpact) / portfolioPriceImpact) * 100;
    }
  }

  const worstRow = rows.reduce((a, b) =>
    a.priceImpact <= b.priceImpact ? a : b
  );

  let breakEvenYears: number | null = null;
  let breakEvenDisplay: string | null = null;

  if (
    scenario.category !== "credit" &&
    portfolioPriceImpact < 0 &&
    weightedAvgRateDelta > 1e-12
  ) {
    const portfolioYieldChange = wad * weightedAvgRateDelta;
    if (portfolioYieldChange > 1e-12) {
      breakEvenYears =
        Math.abs(portfolioPriceImpact) / Math.abs(portfolioYieldChange);
      if (breakEvenYears > 10) {
        breakEvenDisplay = "10+ years to break even";
      } else {
        breakEvenDisplay = `${breakEvenYears.toFixed(1)} years to break even`;
      }
    }
  }

  return {
    wad,
    portfolioYield,
    portfolioConvexity,
    portfolioPriceImpact,
    portfolioDollarImpact,
    totalReturn,
    annualIncome,
    reinvestmentYield,
    weightedAvgRateDelta,
    breakEvenYears,
    breakEvenDisplay,
    rows,
    worstAsset: {
      id: worstRow.id,
      label: worstRow.label,
      impact: worstRow.priceImpact,
    },
    effectivePortfolioValue,
  };
}
