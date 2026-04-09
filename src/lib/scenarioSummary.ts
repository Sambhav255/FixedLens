import type { Scenario } from "../types";
import { ASSET_CLASS_IDS } from "../types";

function fmtBps(decimal: number): string {
  const bps = Math.round(decimal * 10000);
  return `${bps >= 0 ? "+" : ""}${bps}bps`;
}

function fmtBpsSigned(decimal: number, fractionDigits = 0): string {
  const bps = decimal * 10000;
  const sign = bps >= 0 ? "+" : "−";
  const abs = Math.abs(bps).toFixed(fractionDigits);
  return `${sign}${abs}bps`;
}

export function isUniformRate(s: Scenario): boolean {
  const first = s.rateShift.treasury;
  return ASSET_CLASS_IDS.every(
    (id) => Math.abs(s.rateShift[id] - first) < 1e-9
  );
}

/** Key parameters line for active scenario callout (mono, category-specific). */
export function scenarioCalloutKeyParameters(s: Scenario): string {
  const { rateShift: r, spreadShift: sp, category } = s;

  if (category === "rate") {
    if (isUniformRate(s)) {
      return `Δ Rate: ${fmtBpsSigned(r.treasury, 2)} across all maturities`;
    }
    return `Δ Short end: ${fmtBpsSigned(r.treasury)} · Δ Long end: ${fmtBpsSigned(r.hy)}`;
  }

  if (category === "curve") {
    return `Δ Short end: ${fmtBpsSigned(r.treasury)} · Δ Long end: ${fmtBpsSigned(r.hy)}`;
  }

  if (category === "credit") {
    return `IG spread: ${fmtBpsSigned(sp.ig)} · HY spread: ${fmtBpsSigned(sp.hy)}`;
  }

  return `Rate: ${fmtBpsSigned(r.treasury)} · IG: ${fmtBpsSigned(sp.ig)} · HY: ${fmtBpsSigned(sp.hy)}`;
}

/** One-line parameter summary for scenario callout (mono line). */
export function scenarioParameterSummary(s: Scenario): string {
  const parts: string[] = [];
  const { rateShift: r, spreadShift: sp } = s;

  if (isUniformRate(s)) {
    parts.push(`Rate shift: ${fmtBps(r.treasury)}`);
  } else {
    parts.push(
      `Curve (UST/IG/HY): ${fmtBps(r.treasury)}/${fmtBps(r.ig)}/${fmtBps(r.hy)}`
    );
  }

  const spreadBits: string[] = [];
  if (Math.abs(sp.ig) > 1e-8) spreadBits.push(`IG ${fmtBps(sp.ig)}`);
  if (Math.abs(sp.hy) > 1e-8) spreadBits.push(`HY ${fmtBps(sp.hy)}`);
  if (Math.abs(sp.muni) > 1e-8) spreadBits.push(`Munis ${fmtBps(sp.muni)}`);
  if (Math.abs(sp.mbs) > 1e-8) spreadBits.push(`MBS ${fmtBps(sp.mbs)}`);

  if (spreadBits.length > 0) {
    parts.push(`Spreads: ${spreadBits.join(" ")}`);
  }

  return parts.join(" · ");
}
