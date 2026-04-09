import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PRESETS } from "./constants/presets";
import { SCENARIO_BY_ID } from "./constants/scenarios";
import { AIOutputSection } from "./components/AIOutputSection";
import { CollapsiblePanel } from "./components/CollapsiblePanel";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { PortfolioPanel } from "./components/PortfolioPanel";
import { ResultsPanel } from "./components/ResultsPanel";
import { ScenarioPanel } from "./components/ScenarioPanel";
import {
  buildPrompt,
  fetchGeminiAnalysis,
  isGeminiPlaceholderOutput,
} from "./lib/gemini";
import { computePortfolio } from "./lib/pricing";
import type { AssetClassId, Scenario } from "./types";
import { ASSET_CLASS_IDS } from "./types";

function cloneWeights(w: Record<AssetClassId, number>): Record<AssetClassId, number> {
  return { ...w };
}

const CONSERVATIVE_PRESET = PRESETS.find((p) => p.id === "conservative")!;
const OPENING_SCENARIO = SCENARIO_BY_ID.CB1;

export default function App() {
  const [weights, setWeights] = useState<Record<AssetClassId, number>>(() =>
    cloneWeights(CONSERVATIVE_PRESET.weights)
  );
  const [portfolioValue, setPortfolioValue] = useState(1_000_000);
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(
    () => OPENING_SCENARIO
  );
  const [activePreset, setActivePreset] = useState<string | null>(
    () => CONSERVATIVE_PRESET.id
  );
  const [aiOutput, setAiOutput] = useState<{
    clientLetter: string;
    advisorBrief: string;
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const requestId = useRef(0);

  useEffect(() => {
    setActivePreset(CONSERVATIVE_PRESET.id);
    setWeights(cloneWeights(CONSERVATIVE_PRESET.weights));
    setActiveScenario(OPENING_SCENARIO);
  }, []);

  const totalPct = useMemo(
    () =>
      Math.round(
        ASSET_CLASS_IDS.reduce((s, id) => s + weights[id], 0) * 100
      ),
    [weights]
  );
  const allocationValid = totalPct === 100;

  const baseComputed = useMemo(
    () => computePortfolio(weights, portfolioValue, null)!,
    [weights, portfolioValue]
  );

  const resultsComputed = useMemo(() => {
    if (!allocationValid || !activeScenario) return null;
    return computePortfolio(weights, portfolioValue, activeScenario);
  }, [weights, portfolioValue, activeScenario, allocationValid]);

  const onWeightChange = useCallback((id: AssetClassId, pct: number) => {
    setWeights((w) => ({ ...w, [id]: pct / 100 }));
    setActivePreset(null);
  }, []);

  const onSelectPreset = useCallback((id: string, w: Record<AssetClassId, number>) => {
    setActivePreset(id);
    setWeights(cloneWeights(w));
  }, []);

  const onCustomAdjust = useCallback(() => {
    setActivePreset(null);
  }, []);

  useEffect(() => {
    if (!allocationValid || !activeScenario) {
      requestId.current += 1;
      setAiLoading(false);
      setAiOutput(null);
      setAiError(null);
      return;
    }

    const id = ++requestId.current;
    setAiLoading(true);
    setAiError(null);

    const t = window.setTimeout(() => {
      void (async () => {
        try {
          const computed = computePortfolio(
            weights,
            portfolioValue,
            activeScenario
          )!;
          const weightsPct = Object.fromEntries(
            ASSET_CLASS_IDS.map((a) => [a, weights[a] * 100])
          ) as Record<string, number>;
          const out = await fetchGeminiAnalysis(
            buildPrompt(computed, activeScenario, weightsPct),
            ""
          );
          if (requestId.current !== id) return;
          setAiOutput(out);
          setAiError(null);
        } catch {
          if (requestId.current !== id) return;
          setAiError(
            "We couldn’t generate AI analysis. Check your connection or try again."
          );
          setAiOutput(null);
        } finally {
          if (requestId.current === id) setAiLoading(false);
        }
      })();
    }, 800);

    return () => {
      window.clearTimeout(t);
    };
  }, [weights, activeScenario, portfolioValue, allocationValid]);

  const portfolioSummaryMobile = useMemo(
    () => `${totalPct}% · ${baseComputed.wad.toFixed(1)} yr WAD ›`,
    [totalPct, baseComputed.wad]
  );

  const scenarioSummaryMobile =
    activeScenario != null
      ? `${activeScenario.label} ›`
      : "None selected ›";

  const resultsSummaryMobile = useMemo(() => {
    if (!allocationValid) return "Complete allocation ›";
    if (!activeScenario || !resultsComputed) return "Select scenario ›";
    const p = resultsComputed.portfolioPriceImpact;
    return `${p >= 0 ? "+" : ""}${(p * 100).toFixed(2)}% · ${resultsComputed.wad.toFixed(1)} yr ›`;
  }, [allocationValid, activeScenario, resultsComputed]);

  const aiSummaryMobile = useMemo(() => {
    if (!allocationValid || !activeScenario) return "Awaiting setup ›";
    if (aiLoading) return "Generating… ›";
    if (aiError) return "Unavailable ›";
    if (
      aiOutput?.clientLetter &&
      aiOutput.clientLetter.length > 0 &&
      !isGeminiPlaceholderOutput(aiOutput.advisorBrief)
    ) {
      return "Analysis ready ›";
    }
    if (isGeminiPlaceholderOutput(aiOutput?.advisorBrief)) {
      return "Add API key for AI ›";
    }
    return "Ready ›";
  }, [
    allocationValid,
    activeScenario,
    aiLoading,
    aiError,
    aiOutput?.clientLetter,
    aiOutput?.advisorBrief,
  ]);

  const retryAi = useCallback(() => {
    if (!allocationValid || !activeScenario) return;
    const id = ++requestId.current;
    setAiLoading(true);
    setAiError(null);
    void (async () => {
      try {
        const computed = computePortfolio(
          weights,
          portfolioValue,
          activeScenario
        )!;
        const weightsPct = Object.fromEntries(
          ASSET_CLASS_IDS.map((a) => [a, weights[a] * 100])
        ) as Record<string, number>;
        const out = await fetchGeminiAnalysis(
          buildPrompt(computed, activeScenario, weightsPct),
          ""
        );
        if (requestId.current !== id) return;
        setAiOutput(out);
        setAiError(null);
      } catch {
        if (requestId.current !== id) return;
        setAiError(
          "We couldn’t generate AI analysis. Check your connection or try again."
        );
      } finally {
        if (requestId.current === id) setAiLoading(false);
      }
    })();
  }, [weights, activeScenario, portfolioValue, allocationValid]);

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ background: "var(--bg-app)" }}
    >
      <Header
        portfolioValue={portfolioValue}
        onPortfolioValueChange={setPortfolioValue}
      />

      <main className="mx-auto flex w-full max-w-[1680px] flex-1 flex-col">
        <div className="flex flex-col gap-3 p-3 md:hidden">
          <CollapsiblePanel
            title="Portfolio"
            summary={portfolioSummaryMobile}
            defaultOpen
            className="min-h-0"
            bareOnDesktop
          >
            <PortfolioPanel
              hideTitle
              weights={weights}
              onWeightChange={onWeightChange}
              activePreset={activePreset}
              onSelectPreset={onSelectPreset}
              onCustomAdjust={onCustomAdjust}
              totalPct={totalPct}
              wad={baseComputed.wad}
              portfolioYield={baseComputed.portfolioYield}
              portfolioConvexity={baseComputed.portfolioConvexity}
            />
          </CollapsiblePanel>

          <CollapsiblePanel
            title="Scenario"
            summary={scenarioSummaryMobile}
            defaultOpen={false}
            className="min-h-0"
          >
            <ScenarioPanel
              hideTitle
              activeScenario={activeScenario}
              onSelectScenario={setActiveScenario}
            />
          </CollapsiblePanel>

          <CollapsiblePanel
            title="Results"
            summary={resultsSummaryMobile}
            defaultOpen={false}
            className="min-h-0"
          >
            <ResultsPanel
              hideTitle
              scenario={activeScenario}
              computed={resultsComputed}
              allocationValid={allocationValid}
              weights={weights}
            />
          </CollapsiblePanel>

          <CollapsiblePanel
            title="AI Analysis"
            summary={aiSummaryMobile}
            defaultOpen={false}
            bareOnDesktop
            className="min-h-0"
          >
            <AIOutputSection
              clientLetter={aiOutput?.clientLetter ?? null}
              advisorBrief={aiOutput?.advisorBrief ?? null}
              loading={aiLoading}
              error={aiError}
              disabled={!allocationValid || !activeScenario}
              onRetry={retryAi}
              embeddedInMobileAccordion
            />
          </CollapsiblePanel>
        </div>

        <div className="hidden w-full md:block">
          <div
            className="flex flex-row overflow-hidden"
            style={{ height: "calc(100vh - 52px - 220px)" }}
          >
            <CollapsiblePanel
              title="Portfolio"
              summary={portfolioSummaryMobile}
              defaultOpen
              bareOnDesktop
              className="flex h-full min-h-0 w-[288px] shrink-0 flex-col overflow-hidden bg-white md:shadow-[1px_0_0_rgba(0,0,0,0.08)]"
              contentClassName="min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
            >
              <PortfolioPanel
                hideTitle
                weights={weights}
                onWeightChange={onWeightChange}
                activePreset={activePreset}
                onSelectPreset={onSelectPreset}
                onCustomAdjust={onCustomAdjust}
                totalPct={totalPct}
                wad={baseComputed.wad}
                portfolioYield={baseComputed.portfolioYield}
                portfolioConvexity={baseComputed.portfolioConvexity}
              />
            </CollapsiblePanel>

            <CollapsiblePanel
              title="Scenario"
              summary={scenarioSummaryMobile}
              defaultOpen={false}
              bareOnDesktop
              className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white md:shadow-[1px_0_0_rgba(0,0,0,0.08)]"
              contentClassName="min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
            >
              <ScenarioPanel
                hideTitle
                activeScenario={activeScenario}
                onSelectScenario={setActiveScenario}
              />
            </CollapsiblePanel>

            <CollapsiblePanel
              title="Results"
              summary={resultsSummaryMobile}
              defaultOpen={false}
              bareOnDesktop
              className="flex h-full min-h-0 w-[380px] shrink-0 flex-col overflow-hidden bg-[#f9f9f8]"
              contentClassName="min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
            >
              <ResultsPanel
                hideTitle
                scenario={activeScenario}
                computed={resultsComputed}
                allocationValid={allocationValid}
                weights={weights}
              />
            </CollapsiblePanel>
          </div>
        </div>

        <div className="hidden md:block">
          <AIOutputSection
            clientLetter={aiOutput?.clientLetter ?? null}
            advisorBrief={aiOutput?.advisorBrief ?? null}
            loading={aiLoading}
            error={aiError}
            disabled={!allocationValid || !activeScenario}
            onRetry={retryAi}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
