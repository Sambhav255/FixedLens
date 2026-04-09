import { useMemo, useState } from "react";
import { SCENARIOS } from "../constants/scenarios";
import { scenarioCalloutKeyParameters } from "../lib/scenarioSummary";
import type { Scenario, ScenarioCategory } from "../types";

const TABS: { id: ScenarioCategory; label: string }[] = [
  { id: "rate", label: "Rate Shocks" },
  { id: "curve", label: "Curve Shifts" },
  { id: "credit", label: "Credit Events" },
  { id: "combined", label: "Combined" },
];

interface ScenarioPanelProps {
  activeScenario: Scenario | null;
  onSelectScenario: (s: Scenario) => void;
  /** Kept for API compatibility with parent. */
  hideTitle?: boolean;
}

function ChevronRight({ color }: { color: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

export function ScenarioPanel({
  activeScenario,
  onSelectScenario,
}: ScenarioPanelProps) {
  const [tab, setTab] = useState<ScenarioCategory>(
    () => activeScenario?.category ?? "rate"
  );

  const list = useMemo(
    () => SCENARIOS.filter((s) => s.category === tab),
    [tab]
  );

  return (
    <div
      className="flex h-full min-h-0 w-full flex-col"
      style={{
        padding: "20px 18px",
        background: "#ffffff",
      }}
    >
      <div
        className="flex shrink-0 flex-row flex-wrap"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="tab-btn cursor-pointer border-none bg-transparent"
              style={{
                padding: "6px 0",
                marginRight: 20,
                marginBottom: -1,
                fontFamily: "var(--font-sans)",
                fontSize: 12,
                fontWeight: 500,
                color: active ? "#0a0a0a" : "#a3a3a3",
                borderBottom: active
                  ? "2px solid #0f62fe"
                  : "2px solid transparent",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.color = "#525252";
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.color = "#a3a3a3";
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
        style={{ marginTop: 12 }}
      >
        {list.map((s, index) => {
          const selected = activeScenario?.id === s.id;
          return (
            <div key={s.id}>
              {index > 0 ? (
                <div
                  style={{
                    height: 1,
                    background: "rgba(0,0,0,0.05)",
                  }}
                />
              ) : null}
              <button
                type="button"
                onClick={() => onSelectScenario(s)}
                aria-current={selected ? "true" : undefined}
                className="scenario-row group flex w-full cursor-pointer items-center border-none text-left"
                style={{
                  height: 52,
                  paddingTop: 0,
                  paddingBottom: 0,
                  paddingRight: 10,
                  paddingLeft: selected ? 8 : 10,
                  borderRadius: 6,
                  background: selected ? "#eff4ff" : "transparent",
                  borderLeft: selected
                    ? "2px solid #0f62fe"
                    : "2px solid transparent",
                  transition: "background 0.12s ease",
                }}
                onMouseEnter={(e) => {
                  if (!selected) e.currentTarget.style.background = "#f9f9f8";
                }}
                onMouseLeave={(e) => {
                  if (!selected) e.currentTarget.style.background = "transparent";
                }}
              >
                <div className="min-w-0 flex-1 pr-3">
                  <div
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: 13,
                      fontWeight: 500,
                      color: selected ? "#0f62fe" : "#0a0a0a",
                    }}
                  >
                    {s.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: 11,
                      color: selected ? "#6b9fff" : "#a3a3a3",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: 260,
                    }}
                  >
                    {s.description}
                  </div>
                </div>
                <span className="shrink-0" aria-hidden>
                  <ChevronRight
                    color={selected ? "#0f62fe" : "#d4d4d4"}
                  />
                </span>
              </button>
            </div>
          );
        })}
      </div>

      <div className="shrink-0" style={{ marginTop: 16 }}>
        {activeScenario ? (
          <div
            style={{
              background: "#f9f9f8",
              border: "1px solid rgba(0,0,0,0.08)",
              borderLeft: "3px solid #0f62fe",
              borderRadius: "0 7px 7px 0",
              padding: "14px 16px",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 14,
                fontWeight: 600,
                color: "#0a0a0a",
              }}
            >
              {activeScenario.label}
            </div>
            <p
              className="line-clamp-3"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                color: "#525252",
                lineHeight: 1.45,
                marginTop: 4,
              }}
            >
              {activeScenario.macroContext}
            </p>
            <div
              className="financial-num"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "#a3a3a3",
                marginTop: 8,
                lineHeight: 1.4,
              }}
            >
              {scenarioCalloutKeyParameters(activeScenario)}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
