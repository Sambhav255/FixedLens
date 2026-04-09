import type { AssetClassParams } from "../types";

export const ASSET_CLASSES: AssetClassParams[] = [
  {
    id: "treasury",
    label: "US Treasuries",
    modifiedDuration: 6.0,
    convexity: 55,
    currentYield: 0.044,
    spreadDuration: 0,
    isRateOnly: true,
  },
  {
    id: "ig",
    label: "Investment Grade Corporate",
    modifiedDuration: 7.0,
    convexity: 52,
    currentYield: 0.051,
    spreadDuration: 6.8,
    isRateOnly: false,
  },
  {
    id: "hy",
    label: "High Yield Corporate",
    modifiedDuration: 3.5,
    convexity: 18,
    currentYield: 0.072,
    spreadDuration: 3.3,
    isRateOnly: false,
  },
  {
    id: "muni",
    label: "Municipal Bonds",
    modifiedDuration: 6.5,
    convexity: 50,
    currentYield: 0.035,
    spreadDuration: 4.5,
    isRateOnly: false,
  },
  {
    id: "tips",
    label: "TIPS",
    modifiedDuration: 7.5,
    convexity: 65,
    currentYield: 0.021,
    spreadDuration: 0,
    isRateOnly: true,
  },
  {
    id: "mbs",
    label: "Mortgage-Backed Securities (MBS)",
    modifiedDuration: 5.5,
    convexity: 35,
    currentYield: 0.055,
    spreadDuration: 4.0,
    isRateOnly: false,
  },
];

export const ASSET_BY_ID = Object.fromEntries(
  ASSET_CLASSES.map((a) => [a.id, a])
) as Record<AssetClassParams["id"], AssetClassParams>;

export const ASSET_TOOLTIPS: Record<AssetClassParams["id"], string> = {
  treasury:
    "US government bonds. Highest credit quality. Rates-only sensitivity — no credit risk.",
  ig: "Investment-grade corporate bonds (BBB– and above). Sensitive to both rates and credit spreads.",
  hy: "Sub-investment grade bonds (BB+ and below). Higher income, significant credit spread sensitivity.",
  muni: "State and local government bonds. Tax-advantaged income. Moderate rate sensitivity.",
  tips: "Treasury Inflation-Protected Securities. Principal adjusts with CPI. Real rate sensitivity, inflation hedge.",
  mbs: "Mortgage-backed securities. Prepayment risk compresses effective duration in rate rallies.",
};
