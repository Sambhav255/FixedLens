import type { CSSProperties, ReactNode } from "react";
import { ASSET_CLASSES, ASSET_TOOLTIPS } from "../constants/assetClasses";
import { PRESETS } from "../constants/presets";
import { creditQualityLabel } from "../lib/riskLabels";
import type { AssetClassId } from "../types";

const SECTION_LABEL: CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  color: "#a3a3a3",
  marginBottom: 10,
};

interface PortfolioPanelProps {
  weights: Record<AssetClassId, number>;
  onWeightChange: (id: AssetClassId, pct: number) => void;
  activePreset: string | null;
  onSelectPreset: (id: string, w: Record<AssetClassId, number>) => void;
  onCustomAdjust: () => void;
  totalPct: number;
  wad: number;
  portfolioYield: number;
  portfolioConvexity: number;
  /** Kept for API compatibility with parent; desktop layout omits panel title. */
  hideTitle?: boolean;
}

function creditQualityPillStyles(label: string): CSSProperties {
  if (label === "High Quality / Government-Heavy") {
    return {
      background: "#eff9f4",
      color: "#0a7153",
      border: "1px solid rgba(10,113,83,0.2)",
    };
  }
  if (label === "Investment Grade") {
    return {
      background: "#eff4ff",
      color: "#0f62fe",
      border: "1px solid rgba(15,98,254,0.2)",
    };
  }
  if (label === "Blended") {
    return {
      background: "#fff8ee",
      color: "#b45309",
      border: "1px solid rgba(180,83,9,0.2)",
    };
  }
  if (label === "Below Investment Grade Tilt" || label === "Moderate Credit Risk") {
    return {
      background: "#fff1f0",
      color: "#c21b17",
      border: "1px solid rgba(194,27,23,0.2)",
    };
  }
  return {
    background: "#fff8ee",
    color: "#b45309",
    border: "1px solid rgba(180,83,9,0.2)",
  };
}

function allocationBarState(totalPct: number): {
  fillPct: number;
  barColor: string;
  textColor: string;
} {
  if (totalPct === 100) {
    return {
      fillPct: 100,
      barColor: "#0a7153",
      textColor: "#0a7153",
    };
  }
  if (totalPct > 100 || totalPct < 80) {
    return {
      fillPct: Math.min(100, totalPct),
      barColor: "#c21b17",
      textColor: "#c21b17",
    };
  }
  return {
    fillPct: totalPct,
    barColor: "#b45309",
    textColor: "#b45309",
  };
}

export function PortfolioPanel({
  weights,
  onWeightChange,
  activePreset,
  onSelectPreset,
  onCustomAdjust,
  totalPct,
  wad,
  portfolioYield,
  portfolioConvexity,
}: PortfolioPanelProps) {
  const credit = creditQualityLabel(weights);
  const pillStyles = creditQualityPillStyles(credit);
  const alloc = allocationBarState(totalPct);

  return (
    <div
      className="w-full"
      style={{
        width: "100%",
        padding: "20px 18px",
        background: "#ffffff",
      }}
    >
      <div
        className="grid grid-cols-1 gap-2"
        style={{ gap: 8 }}
      >
        {PRESETS.map((p) => {
          const wadPreset = ASSET_CLASSES.reduce(
            (s, a) => s + p.weights[a.id] * a.modifiedDuration,
            0
          );
          const wyPct =
            ASSET_CLASSES.reduce(
              (s, a) => s + p.weights[a.id] * a.currentYield,
              0
            ) * 100;
          const active = activePreset === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelectPreset(p.id, p.weights)}
              className={`preset-card text-left ${active ? "preset-card--active" : ""}`}
              aria-current={active ? "true" : undefined}
              aria-label={`${p.label} preset, ${wadPreset.toFixed(1)} year duration, ${wyPct.toFixed(1)}% yield`}
              style={{
                background: active ? undefined : "#f9f9f8",
                borderRadius: 7,
                padding: "8px 12px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 11,
                  fontWeight: 500,
                  color: active ? "#0f62fe" : "#0a0a0a",
                  lineHeight: 1.3,
                }}
              >
                {p.label}
              </div>
              <div
                className="financial-num"
                style={{
                  fontSize: 10,
                  color: "#a3a3a3",
                  marginTop: 2,
                  lineHeight: 1.3,
                }}
              >
                {wadPreset.toFixed(1)}yr · {wyPct.toFixed(1)}%
              </div>
            </button>
          );
        })}
      </div>

      <div
        style={{
          height: 1,
          background: "rgba(0,0,0,0.06)",
          margin: "16px 0",
        }}
        aria-hidden
      />

      <div>
        {ASSET_CLASSES.map((a) => {
          const pct = Math.round(weights[a.id] * 100);
          return (
            <div key={a.id} style={{ marginBottom: 13 }}>
              <div className="mb-1 flex items-center gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-1">
                  <span
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#0a0a0a",
                    }}
                  >
                    {a.label}
                  </span>
                  <span
                    className="cursor-help select-none"
                    style={{
                      fontSize: 10,
                      color: "#a3a3a3",
                      lineHeight: 1,
                    }}
                    title={ASSET_TOOLTIPS[a.id]}
                    aria-label={ASSET_TOOLTIPS[a.id]}
                  >
                    ⓘ
                  </span>
                </div>
                <span
                  className="financial-num shrink-0"
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    minWidth: 34,
                    textAlign: "right",
                    color: pct > 0 ? "#0f62fe" : "#a3a3a3",
                  }}
                >
                  {pct}%
                </span>
              </div>
              <div
                className="portfolio-slider-wrap"
                style={
                  {
                    "--range-pct": `${pct}%`,
                  } as CSSProperties
                }
              >
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={pct}
                  className="portfolio-slider"
                  aria-label={`${a.label} allocation`}
                  onChange={(e) => {
                    onCustomAdjust();
                    onWeightChange(a.id, Number(e.target.value));
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 4 }}>
        <div
          style={{
            height: 3,
            borderRadius: 2,
            background: "#e5e5e5",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${Math.min(totalPct, 100)}%`,
              borderRadius: 2,
              background: alloc.barColor,
              transition: "width 0.3s ease, background-color 0.3s ease",
            }}
          />
        </div>
        <div
          className="financial-num mt-2 flex items-center justify-between"
          style={{ fontSize: 11 }}
        >
          <span style={{ color: alloc.textColor }}>
            {totalPct}% allocated
          </span>
          {totalPct === 100 ? (
            <span style={{ color: "#0a7153" }}>✓ Balanced</span>
          ) : (
            <span style={{ color: "transparent", userSelect: "none" }}>–</span>
          )}
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          background: "#f9f9f8",
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: 8,
          padding: 14,
        }}
      >
        <div style={{ ...SECTION_LABEL, marginBottom: 10 }}>Summary</div>
        <div
          className="grid gap-x-2.5 gap-y-2.5"
          style={{ gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          <MetricCell
            label="Duration"
            value={<span style={{ color: "#0a0a0a" }}>{wad.toFixed(1)} yrs</span>}
          />
          <MetricCell
            label="Yield"
            value={
              <span style={{ color: "#0a7153" }}>
                {(portfolioYield * 100).toFixed(2)}%
              </span>
            }
          />
          <MetricCell
            label="Convexity"
            value={
              <span style={{ color: "#0a0a0a" }}>
                {portfolioConvexity.toFixed(1)}
              </span>
            }
          />
          <div>
            <div
              style={{
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                color: "#a3a3a3",
                marginBottom: 3,
              }}
            >
              Credit Quality
            </div>
            <span
              style={{
                display: "inline-block",
                padding: "2px 8px",
                borderRadius: 10,
                fontSize: 10,
                fontWeight: 500,
                fontFamily: "var(--font-sans)",
                ...pillStyles,
              }}
            >
              {credit}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCell({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          color: "#a3a3a3",
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      <div
        className="financial-num"
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: "#0a0a0a",
        }}
      >
        {value}
      </div>
    </div>
  );
}
