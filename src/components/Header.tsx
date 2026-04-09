import { useEffect, useState } from "react";
import { parsePortfolioValueInput } from "../lib/formatCurrency";

interface HeaderProps {
  portfolioValue: number;
  onPortfolioValueChange: (n: number) => void;
}

function formatPortfolioBlur(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "";
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
}

export function Header({ portfolioValue, onPortfolioValueChange }: HeaderProps) {
  const [draft, setDraft] = useState(() => formatPortfolioBlur(portfolioValue));
  const [valueFocused, setValueFocused] = useState(false);

  useEffect(() => {
    setDraft(formatPortfolioBlur(portfolioValue));
  }, [portfolioValue]);

  const commitPortfolioInput = () => {
    const n = parsePortfolioValueInput(draft);
    const next = n > 0 ? n : 1_000_000;
    onPortfolioValueChange(next);
    setDraft(formatPortfolioBlur(next));
  };

  return (
    <header
      className="sticky top-0 z-50 flex w-full shrink-0 items-center justify-between"
      style={{
        height: 52,
        minHeight: 52,
        padding: "0 24px",
        background: "#ffffff",
        borderBottom: "1px solid rgba(0,0,0,0.08)",
      }}
    >
      <div className="flex min-w-0 items-center">
        <span
          className="shrink-0"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 15,
            fontWeight: 600,
            color: "#0a0a0a",
            letterSpacing: "-0.02em",
          }}
        >
          FixedLens
        </span>
        <span
          className="shrink-0"
          style={{
            width: 1,
            height: 16,
            marginLeft: 12,
            marginRight: 12,
            background: "rgba(0,0,0,0.12)",
          }}
          aria-hidden
        />
        <span
          className="truncate"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 12,
            fontWeight: 400,
            color: "#a3a3a3",
          }}
        >
          Fixed Income Stress Testing
        </span>
      </div>

      <div className="flex shrink-0 items-center" style={{ gap: 12 }}>
        <label
          htmlFor="header-portfolio-value"
          className="shrink-0 whitespace-nowrap"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 11,
            fontWeight: 500,
            color: "#a3a3a3",
          }}
        >
          Portfolio Value
        </label>
        <input
          id="header-portfolio-value"
          type="text"
          inputMode="decimal"
          className="financial-num"
          style={{
            width: 128,
            padding: "5px 10px",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            color: "#0a0a0a",
            background: valueFocused ? "#ffffff" : "#f5f5f3",
            border: `1px solid ${valueFocused ? "#0f62fe" : "rgba(0,0,0,0.10)"}`,
            outline: "none",
            transition: "all 0.15s ease",
          }}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            setValueFocused(false);
            commitPortfolioInput();
          }}
          onFocus={() => {
            setValueFocused(true);
            setDraft(
              portfolioValue > 0 ? String(Math.round(portfolioValue)) : ""
            );
          }}
        />

        <span
          className="interactive-transition hidden whitespace-nowrap sm:inline-block"
          style={{
            background: "#f5f5f3",
            border: "1px solid rgba(0,0,0,0.08)",
            padding: "3px 9px",
            borderRadius: 20,
            fontSize: 10,
            color: "#a3a3a3",
            fontFamily: "var(--font-sans)",
            cursor: "default",
            transition: "all 0.15s ease",
          }}
          title="Price change estimated as: ΔP/P ≈ −ModDur × Δy + ½ × Conv × Δy². Not a full repricing model. Asset parameters represent approximate 2025–2026 index exposures."
        >
          Simplified duration model
        </span>
      </div>
    </header>
  );
}
