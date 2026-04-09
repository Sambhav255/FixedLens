import type { CSSProperties } from "react";
import { useMemo } from "react";
import { formatSignedUsd, formatUsd } from "../lib/formatCurrency";
import type { PortfolioComputed } from "../lib/pricing";
import {
  concentrationRiskTier,
  creditRiskTier,
  durationRiskTier,
  type ConcentrationTier,
  type RiskTier,
} from "../lib/riskLabels";
import { ASSET_CLASSES } from "../constants/assetClasses";
import type { AssetClassId, Scenario } from "../types";

interface ResultsPanelProps {
  scenario: Scenario | null;
  computed: PortfolioComputed | null;
  allocationValid: boolean;
  weights: Record<AssetClassId, number>;
  hideTitle?: boolean;
}

function tierBadgeStyle(tier: RiskTier | ConcentrationTier): CSSProperties {
  if (tier === "LOW") {
    return {
      background: "#eff9f4",
      color: "#0a7153",
      border: "1px solid rgba(10,113,83,0.2)",
    };
  }
  if (tier === "MODERATE") {
    return {
      background: "#fff8ee",
      color: "#b45309",
      border: "1px solid rgba(180,83,9,0.2)",
    };
  }
  if (tier === "HIGH") {
    return {
      background: "#fff1f0",
      color: "#c21b17",
      border: "1px solid rgba(194,27,23,0.2)",
    };
  }
  if (tier === "EXTREME") {
    return {
      background: "#c21b17",
      color: "#ffffff",
      border: "1px solid #c21b17",
    };
  }
  return {
    background: "#fff1f0",
    color: "#c21b17",
    border: "1px solid rgba(194,27,23,0.2)",
  };
}

const BREAK_EVEN_TOOLTIP =
  "Time for higher reinvestment income to recover the initial mark-to-market loss. Applies only to rate-up scenarios. Formula: |Price Impact| ÷ |Δ Portfolio Yield|.";

function assetConvexityTitle(r: {
  id: AssetClassId;
  convexity: number;
}): string {
  const a = ASSET_CLASSES.find((x) => x.id === r.id)!;
  const tail = a.isRateOnly
    ? "Rate-only — no credit spread sensitivity."
    : `Credit-sensitive — spread duration: ${a.spreadDuration.toFixed(1)} yrs.`;
  return `Convexity: ${r.convexity.toFixed(1)}. ${tail}`;
}

function formatBreakEven(
  computed: PortfolioComputed,
  scenario: Scenario
): { text: string; title: string; color: "positive" | "muted" } {
  if (scenario.category === "credit") {
    return {
      text: "N/A — no rate shift",
      title: BREAK_EVEN_TOOLTIP,
      color: "muted",
    };
  }

  const pi = computed.portfolioPriceImpact;
  if (pi > 0) {
    return {
      text: "Immediate gain",
      title: BREAK_EVEN_TOOLTIP,
      color: "positive",
    };
  }

  if (pi === 0) {
    return { text: "—", title: BREAK_EVEN_TOOLTIP, color: "muted" };
  }

  if (computed.breakEvenYears != null && computed.breakEvenYears <= 10) {
    return {
      text: `${computed.breakEvenYears.toFixed(1)} yrs to break even`,
      title: BREAK_EVEN_TOOLTIP,
      color: "positive",
    };
  }

  if (computed.breakEvenDisplay?.startsWith("10+")) {
    return {
      text: "10+ yrs to break even",
      title: BREAK_EVEN_TOOLTIP,
      color: "positive",
    };
  }

  return {
    text: "N/A — no offsetting rate lift",
    title: BREAK_EVEN_TOOLTIP,
    color: "muted",
  };
}

function priceDirection(
  pi: number
): "negative" | "positive" | "neutral" {
  if (pi < 0) return "negative";
  if (pi > 0) return "positive";
  return "neutral";
}

function formatSignedPct(decimal: number, fractionDigits: number): string {
  const p = decimal * 100;
  const abs = Math.abs(p).toFixed(fractionDigits);
  if (p > 0) return `+${abs}%`;
  if (p < 0) return `−${abs}%`;
  return `+${abs}%`;
}

export function ResultsPanel({
  scenario,
  computed,
  allocationValid,
  weights,
}: ResultsPanelProps) {
  const risk = useMemo(() => {
    if (!computed) return null;
    const hyPct = weights.hy * 100;
    return {
      duration: durationRiskTier(computed.wad),
      credit: creditRiskTier(hyPct),
      concentration: concentrationRiskTier(weights),
    };
  }, [computed, weights]);

  const shellStyle: CSSProperties = {
    width: "100%",
    padding: "20px 18px",
    background: "#f9f9f8",
  };

  if (!allocationValid) {
    return (
      <div style={shellStyle}>
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 13,
            color: "#c21b17",
            marginTop: 8,
          }}
        >
          Complete your allocation to run analysis.
        </p>
      </div>
    );
  }

  if (!scenario || !computed) {
    return (
      <div
        className="flex flex-col"
        style={{
          ...shellStyle,
          minHeight: "100%",
        }}
      >
        <div className="flex flex-1 flex-col items-center justify-center px-2">
          <div
            className="flex flex-col items-center justify-center"
            style={{
              width: "100%",
              border: "1.5px dashed rgba(0,0,0,0.12)",
              borderRadius: 8,
              padding: "32px 24px",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                color: "#a3a3a3",
                textAlign: "center",
              }}
            >
              Select a scenario
            </p>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 11,
                color: "#c4c4c4",
                textAlign: "center",
                marginTop: 4,
              }}
            >
              Results will appear here
            </p>
          </div>
        </div>
      </div>
    );
  }

  const pi = computed.portfolioPriceImpact;
  const dir = priceDirection(pi);
  const accentVar =
    dir === "negative"
      ? "#c21b17"
      : dir === "positive"
        ? "#0a7153"
        : "#a3a3a3";
  const priceImpactCardBg: CSSProperties =
    dir === "negative"
      ? {
          backgroundColor: "#ffffff",
          backgroundImage:
            "linear-gradient(rgba(194,27,23,0.03), rgba(194,27,23,0.03))",
        }
      : dir === "positive"
        ? {
            backgroundColor: "#ffffff",
            backgroundImage:
              "linear-gradient(rgba(10,113,83,0.03), rgba(10,113,83,0.03))",
          }
        : { backgroundColor: "#ffffff" };

  const breakEven = formatBreakEven(computed, scenario);
  const metricsFlashKey = `${scenario.id}-${JSON.stringify(weights)}`;
  const piFormatted = formatSignedPct(pi, 2);
  const trFormatted = formatSignedPct(computed.totalReturn, 2);

  const TH: CSSProperties = {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    color: "#a3a3a3",
    padding: "7px 12px",
    textAlign: "left",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
    background: "#f9f9f8",
  };

  return (
    <div
      className="flex min-h-0 min-w-0 flex-col overflow-y-auto"
      style={shellStyle}
    >
      <div style={{ marginTop: 0 }}>
        <div
          className={dir === "negative" ? "pulse-negative-once" : ""}
          style={{
            width: "100%",
            padding: 16,
            borderRadius: 8,
            border: "1px solid rgba(0,0,0,0.08)",
            borderLeft: `3px solid ${accentVar}`,
            ...priceImpactCardBg,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: "#a3a3a3",
            }}
          >
            PRICE IMPACT
          </div>
          <div
            key={`${metricsFlashKey}-pi`}
            className="financial-num metric-flash-mount"
            style={{
              fontSize: 36,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: accentVar,
              lineHeight: 1.1,
              marginTop: 4,
              transition: "opacity 0.3s ease",
            }}
          >
            {piFormatted}
          </div>
          <div
            key={`${metricsFlashKey}-usd`}
            className="financial-num metric-flash-mount"
            style={{
              fontSize: 13,
              color: accentVar,
              opacity: 0.7,
              marginTop: 3,
              transition: "opacity 0.3s ease",
            }}
          >
            {formatSignedUsd(computed.portfolioDollarImpact, {
              maximumFractionDigits: 0,
            })}
          </div>
        </div>

        <div className="flex gap-2" style={{ marginTop: 8, gap: 8 }}>
          <div
            className="min-w-0 flex-1"
            style={{
              padding: "11px 12px",
              background: "#ffffff",
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 7,
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                color: "#a3a3a3",
                marginBottom: 4,
              }}
            >
              1-YR TOTAL RETURN
            </div>
            <div
              key={`${metricsFlashKey}-tr`}
              className="financial-num metric-flash-mount"
              style={{
                fontSize: 15,
                fontWeight: 500,
                color:
                  computed.totalReturn < 0 ? "#c21b17" : "#0a7153",
                transition: "opacity 0.3s ease",
              }}
            >
              {trFormatted}
            </div>
          </div>
          <div
            className="min-w-0 flex-1"
            style={{
              padding: "11px 12px",
              background: "#ffffff",
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 7,
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                color: "#a3a3a3",
                marginBottom: 4,
              }}
            >
              DURATION
            </div>
            <div
              key={`${metricsFlashKey}-wad`}
              className="financial-num metric-flash-mount"
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: "#0a0a0a",
                transition: "opacity 0.3s ease",
              }}
            >
              {computed.wad.toFixed(1)}
              <span style={{ fontWeight: 500 }}> yrs</span>
            </div>
          </div>
          <div
            className="min-w-0 flex-1"
            style={{
              padding: "11px 12px",
              background: "#ffffff",
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 7,
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                color: "#a3a3a3",
                marginBottom: 4,
              }}
            >
              HIGHEST IMPACT
            </div>
            <div
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 12,
                fontWeight: 500,
                color: "#0a0a0a",
                lineHeight: 1.3,
              }}
            >
              {computed.worstAsset.label}
            </div>
            <div
              className="financial-num"
              style={{
                fontSize: 11,
                marginTop: 2,
                color:
                  computed.worstAsset.impact < 0 ? "#c21b17" : "#0a7153",
              }}
            >
              {formatSignedPct(computed.worstAsset.impact, 2)}
            </div>
          </div>
        </div>
      </div>

      <div
        className="min-w-0 overflow-x-auto"
        style={{
          marginTop: 8,
          background: "#ffffff",
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <table
          className="w-full border-collapse text-left"
          style={{
            tableLayout: "fixed",
            width: "100%",
            minWidth: 314,
          }}
        >
          <colgroup>
            <col style={{ width: 108 }} />
            <col style={{ width: 38 }} />
            <col style={{ width: 36 }} />
            <col style={{ width: 60 }} />
            <col style={{ width: 72 }} />
          </colgroup>
          <thead>
            <tr>
              <th style={TH}>Asset</th>
              <th style={{ ...TH, textAlign: "right" }}>Alloc</th>
              <th style={{ ...TH, textAlign: "right" }}>Dur</th>
              <th style={{ ...TH, textAlign: "right" }}>Price Δ</th>
              <th style={{ ...TH, textAlign: "right" }}>$ Impact</th>
            </tr>
          </thead>
          <tbody>
            {computed.rows.map((r) => {
              const zero = r.allocation === 0;
              const cellColor =
                r.priceImpact < 0
                  ? "#c21b17"
                  : r.priceImpact > 0
                    ? "#0a7153"
                    : "#a3a3a3";
              const pillBg =
                r.priceImpact < 0
                  ? "rgba(194,27,23,0.08)"
                  : r.priceImpact > 0
                    ? "rgba(10,113,83,0.08)"
                    : "transparent";

              const TD: CSSProperties = {
                padding: "7px 12px",
                borderBottom: "1px solid rgba(0,0,0,0.05)",
                verticalAlign: "top",
              };

              return (
                <tr
                  key={r.id}
                  style={{
                    minHeight: 34,
                    display: zero ? "none" : undefined,
                  }}
                >
                  <td
                    title={assetConvexityTitle(r)}
                    style={{
                      ...TD,
                      fontFamily: "var(--font-sans)",
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#0a0a0a",
                      lineHeight: 1.25,
                      wordBreak: "break-word",
                      whiteSpace: "normal",
                      maxWidth: 108,
                    }}
                  >
                    {r.label}
                  </td>
                  <td
                    className="financial-num"
                    style={{
                      ...TD,
                      fontSize: 11,
                      color: "#a3a3a3",
                      textAlign: "right",
                    }}
                  >
                    {(r.allocation * 100).toFixed(0)}%
                  </td>
                  <td
                    className="financial-num"
                    style={{
                      ...TD,
                      fontSize: 11,
                      color: "#a3a3a3",
                      textAlign: "right",
                    }}
                  >
                    {r.duration.toFixed(1)}
                  </td>
                  <td style={{ ...TD, textAlign: "right" }}>
                    <span
                      className="financial-num"
                      style={{
                        display: "inline-block",
                        fontSize: 11,
                        color: cellColor,
                        background: pillBg,
                        borderRadius: 3,
                        padding: "1px 5px",
                      }}
                    >
                      {formatSignedPct(r.priceImpact, 2)}
                    </span>
                  </td>
                  <td
                    className="financial-num"
                    style={{
                      ...TD,
                      fontSize: 11,
                      color: cellColor,
                      textAlign: "right",
                    }}
                  >
                    {formatSignedUsd(r.dollarImpact, {
                      maximumFractionDigits: 0,
                    })}
                  </td>
                </tr>
              );
            })}
            <tr
              style={{
                background: "#f9f9f8",
                borderTop: "1px solid rgba(0,0,0,0.10)",
              }}
            >
              <td
                colSpan={3}
                style={{
                  ...TH,
                  borderBottom: "none",
                  background: "#f9f9f8",
                  fontFamily: "var(--font-sans)",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#0a0a0a",
                  textTransform: "none",
                  letterSpacing: "normal",
                }}
              >
                Portfolio Total
              </td>
              <td
                style={{
                  padding: "7px 12px",
                  textAlign: "right",
                  background: "#f9f9f8",
                }}
              >
                <span
                  className="financial-num"
                  style={{
                    display: "inline-block",
                    fontSize: 11,
                    fontWeight: 600,
                    color: accentVar,
                    background:
                      dir === "neutral"
                        ? "transparent"
                        : dir === "negative"
                          ? "rgba(194,27,23,0.08)"
                          : "rgba(10,113,83,0.08)",
                    borderRadius: 3,
                    padding: "1px 5px",
                  }}
                >
                  {formatSignedPct(pi, 2)}
                </span>
              </td>
              <td
                className="financial-num"
                style={{
                  padding: "7px 12px",
                  fontSize: 11,
                  fontWeight: 600,
                  color: accentVar,
                  textAlign: "right",
                  background: "#f9f9f8",
                }}
              >
                {formatSignedUsd(computed.portfolioDollarImpact, {
                  maximumFractionDigits: 0,
                })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        className="flex flex-row flex-wrap"
        style={{
          marginTop: 8,
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <IncomeStat
          label="ANNUAL INCOME (EST.)"
          value={formatUsd(computed.annualIncome, { maximumFractionDigits: 0 })}
        />
        <IncomeStat
          label="POST-SCENARIO YIELD"
          value={`${(computed.reinvestmentYield * 100).toFixed(2)}%`}
        />
        <div className="min-w-0" style={{ flex: "1 1 120px", maxWidth: 200 }}>
          <div
            style={{
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: "#a3a3a3",
              marginBottom: 4,
            }}
          >
            Break-Even Horizon
            <span
              className="cursor-help"
              style={{ marginLeft: 4, fontSize: 10 }}
              title={breakEven.title}
              aria-label={breakEven.title}
            >
              ⓘ
            </span>
          </div>
          <div
            className="financial-num"
            style={{
              fontSize: 12,
              fontWeight: 500,
              color:
                breakEven.color === "positive"
                  ? "#0a7153"
                  : "#a3a3a3",
            }}
          >
            {breakEven.text}
          </div>
        </div>
      </div>

      {risk && (
        <div
          className="flex flex-row flex-wrap"
          style={{ marginTop: 8, gap: 8 }}
        >
          {(
            [
              ["Duration Risk", risk.duration],
              ["Credit Risk", risk.credit],
              ["Concentration Risk", risk.concentration],
            ] as const
          ).map(([label, tier]) => (
            <div key={label} className="min-w-0" style={{ flex: "1 1 90px" }}>
              <span
                style={{
                  fontSize: 9,
                  color: "#a3a3a3",
                  display: "block",
                  marginBottom: 3,
                }}
              >
                {label}
              </span>
              <span
                style={{
                  display: "inline-block",
                  padding: "3px 9px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 500,
                  ...tierBadgeStyle(tier),
                }}
              >
                {tier}
              </span>
            </div>
          ))}
        </div>
      )}

      <p
        className="financial-num"
        style={{
          marginTop: 6,
          marginBottom: 0,
          fontSize: 10,
          lineHeight: 1.4,
          color: "#c4c4c4",
        }}
      >
        Model: ΔP/P ≈ −ModDur × Δy + ½ × Conv × Δy² · Spread: −SpreadDur ×
        ΔSpread · Params: ~2025–2026 index
      </p>
    </div>
  );
}

function IncomeStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0" style={{ flex: "1 1 100px" }}>
      <div
        style={{
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          color: "#a3a3a3",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        className="financial-num"
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: "#0a0a0a",
        }}
      >
        {value}
      </div>
    </div>
  );
}
