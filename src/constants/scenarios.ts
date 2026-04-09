import type { AssetClassId, Scenario } from "../types";
import { ASSET_CLASS_IDS } from "../types";

function uniformRate(dy: number): Record<AssetClassId, number> {
  return Object.fromEntries(
    ASSET_CLASS_IDS.map((id) => [id, dy])
  ) as Record<AssetClassId, number>;
}

function zeroSpread(): Record<AssetClassId, number> {
  return Object.fromEntries(
    ASSET_CLASS_IDS.map((id) => [id, 0])
  ) as Record<AssetClassId, number>;
}

function curve(
  r: Record<AssetClassId, number>
): { rate: Record<AssetClassId, number>; spread: Record<AssetClassId, number> } {
  return { rate: r, spread: zeroSpread() };
}

/** MBS spread = 50% of IG spread delta (PRD §4.3 credit scenarios). */
function creditSpreads(
  igBps: number,
  hyBps: number,
  muniBps: number
): Record<AssetClassId, number> {
  const ig = igBps / 10_000;
  const hy = hyBps / 10_000;
  const muni = muniBps / 10_000;
  const mbs = 0.5 * ig;
  return {
    treasury: 0,
    ig,
    hy,
    muni,
    tips: 0,
    mbs,
  };
}

/** Combined scenarios: munis and MBS not in PRD table — munis = 0.5× IG, MBS = 0.5× IG. */
function combinedSpreads(igBps: number, hyBps: number): Record<AssetClassId, number> {
  const ig = igBps / 10_000;
  const hy = hyBps / 10_000;
  return {
    treasury: 0,
    ig,
    hy,
    muni: 0.5 * ig,
    tips: 0,
    mbs: 0.5 * ig,
  };
}

const c1 = curve({
  treasury: 0.012,
  ig: 0.011,
  hy: 0.016,
  muni: 0.011,
  tips: 0.009,
  mbs: 0.014,
});

const c2 = curve({
  treasury: 0.011,
  ig: 0.013,
  hy: 0.007,
  muni: 0.012,
  tips: 0.014,
  mbs: 0.009,
});

const c3 = curve({
  treasury: -0.006,
  ig: -0.008,
  hy: -0.003,
  muni: -0.0075,
  tips: -0.009,
  mbs: -0.0045,
});

const c4 = curve({
  treasury: 0.008,
  ig: 0.007,
  hy: 0.013,
  muni: 0.007,
  tips: 0.004,
  mbs: 0.011,
});

export const SCENARIOS: Scenario[] = [
  {
    id: "RS1",
    category: "rate",
    label: "Hawkish Surprise",
    description:
      "Fed signals higher-for-longer, rates reprice +100bps across the curve.",
    macroContext:
      "Markets reprice toward a higher terminal rate as the Fed signals policy will stay restrictive.",
    rateShift: uniformRate(0.01),
    spreadShift: zeroSpread(),
  },
  {
    id: "RS2",
    category: "rate",
    label: "Tightening Cycle",
    description: "Sustained Fed hikes — rates climb +200bps over twelve months.",
    macroContext:
      "A full hiking cycle is priced in, with parallel upward shifts across maturities.",
    rateShift: uniformRate(0.02),
    spreadShift: zeroSpread(),
  },
  {
    id: "RS3",
    category: "rate",
    label: "2022 Replay",
    description: "Aggressive tightening — fastest rate cycle since the 1980s.",
    macroContext:
      "An abrupt repricing similar to 2022, with sharp parallel rises in yields.",
    rateShift: uniformRate(0.03),
    spreadShift: zeroSpread(),
  },
  {
    id: "RS4",
    category: "rate",
    label: "Recession Rally",
    description: "Growth scare triggers flight to quality — rates fall −100bps.",
    macroContext:
      "Growth concerns dominate; investors bid up bonds and yields fall in parallel.",
    rateShift: uniformRate(-0.01),
    spreadShift: zeroSpread(),
  },
  {
    id: "RS5",
    category: "rate",
    label: "Crisis Rally",
    description: "Financial stress and emergency cuts — 2008 / 2020 analog.",
    macroContext:
      "A shock drives aggressive easing expectations and a sharp parallel rally in rates.",
    rateShift: uniformRate(-0.02),
    spreadShift: zeroSpread(),
  },
  {
    id: "RS6",
    category: "rate",
    label: "Mild Adjustment",
    description: "Orderly normalization — rates move +50bps.",
    macroContext:
      "A modest parallel upward shift as markets adjust to slightly higher policy rates.",
    rateShift: uniformRate(0.005),
    spreadShift: zeroSpread(),
  },
  {
    id: "CS1",
    category: "curve",
    label: "Bear Flattener",
    description:
      "Short rates +200bps, long rates +75bps — Fed hikes while the market doubts growth.",
    macroContext:
      "Front-end yields rise more than long-end yields; curve flattens in a bearish rates environment.",
    rateShift: c1.rate,
    spreadShift: c1.spread,
  },
  {
    id: "CS2",
    category: "curve",
    label: "Bear Steepener",
    description:
      "Short rates +50bps, long rates +150bps — term premium and fiscal concerns.",
    macroContext:
      "Long-end yields rise faster than short-end yields; the curve steepens as term premium expands.",
    rateShift: c2.rate,
    spreadShift: c2.spread,
  },
  {
    id: "CS3",
    category: "curve",
    label: "Bull Steepener",
    description: "Short rates −125bps (cuts), long rates −25bps — early easing cycle.",
    macroContext:
      "The Fed cuts aggressively at the front end while long yields fall less — classic early-cycle steepening.",
    rateShift: c3.rate,
    spreadShift: c3.spread,
  },
  {
    id: "CS4",
    category: "curve",
    label: "Yield Curve Inversion",
    description:
      "Short rates +175bps, long rates +25bps — extreme inversion deepens.",
    macroContext:
      "Policy rates push short yields sharply higher while long-end anchors; inversion worsens.",
    rateShift: c4.rate,
    spreadShift: c4.spread,
  },
  {
    id: "CE1",
    category: "credit",
    label: "Mild Credit Stress",
    description: "Softening economy — IG, HY, and muni spreads widen modestly.",
    macroContext:
      "Growth slows and risk premia rise; credit spreads widen from a low base while rates drift slightly higher.",
    rateShift: uniformRate(0.0025),
    spreadShift: creditSpreads(75, 200, 25),
  },
  {
    id: "CE2",
    category: "credit",
    label: "Moderate Downturn",
    description: "Recession fears — IG and HY spreads reprice wider.",
    macroContext:
      "Recession probabilities rise; investment-grade and high-yield spreads widen materially.",
    rateShift: uniformRate(0),
    spreadShift: creditSpreads(150, 400, 75),
  },
  {
    id: "CE3",
    category: "credit",
    label: "2020 COVID Shock",
    description: "Sudden liquidity crisis — March 2020 analog.",
    macroContext:
      "A shock to liquidity drives rapid spread widening and a flight to Treasuries, with front-end yields falling.",
    rateShift: uniformRate(-0.005),
    spreadShift: creditSpreads(250, 600, 150),
  },
  {
    id: "CE4",
    category: "credit",
    label: "2008 GFC Analog",
    description: "Systemic stress — extreme HY dislocation.",
    macroContext:
      "A systemic credit event: high-yield and structured credit dislocate while quality duration rallies.",
    rateShift: uniformRate(-0.01),
    spreadShift: creditSpreads(400, 1500, 300),
  },
  {
    id: "CB1",
    category: "combined",
    label: "Stagflation",
    description: "Rates rise on inflation while credit stress builds from slowing growth.",
    macroContext:
      "Higher nominal rates persist alongside widening credit spreads as growth and inflation diverge.",
    rateShift: uniformRate(0.02),
    spreadShift: combinedSpreads(150, 300),
  },
  {
    id: "CB2",
    category: "combined",
    label: "Hard Landing",
    description: "Sharp Fed cuts but spreads blow out as recession deepens.",
    macroContext:
      "Policy eases into a recession but credit spreads widen sharply on default risk.",
    rateShift: uniformRate(-0.01),
    spreadShift: combinedSpreads(200, 500),
  },
  {
    id: "CB3",
    category: "combined",
    label: "Global Risk-Off",
    description: "Dollar surge, geopolitical shock — rates down, credit wider.",
    macroContext:
      "Safe-haven flows compress Treasury yields while risky assets reprice wider.",
    rateShift: uniformRate(-0.0075),
    spreadShift: combinedSpreads(175, 450),
  },
  {
    id: "CB4",
    category: "combined",
    label: "Soft Landing (Base Case)",
    description: "Gradual normalization — mild rate decline, spreads stable to tighter.",
    macroContext:
      "Inflation cools without a deep recession; yields ease modestly and spreads tighten slightly.",
    rateShift: uniformRate(-0.005),
    spreadShift: combinedSpreads(-25, -50),
  },
];

export const SCENARIO_BY_ID = Object.fromEntries(
  SCENARIOS.map((s) => [s.id, s])
) as Record<string, Scenario>;
