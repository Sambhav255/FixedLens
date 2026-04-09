import type { Scenario } from "../types";
import type { PortfolioComputed } from "./pricing";

const GEMINI_MODEL = "gemini-2.0-flash";

function parseModelJson(text: string): unknown {
  const t = text.trim();
  const unfenced = t
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
  return JSON.parse(unfenced) as unknown;
}

export interface GeminiAnalysisPayload {
  portfolio: PortfolioComputed;
  scenario: Scenario;
  weightsPct: Record<string, number>;
}

export function buildPrompt(
  portfolio: PortfolioComputed,
  scenario: Scenario,
  weightsPct: Record<string, number>
): string {
  const assetBreakdown = portfolio.rows
    .filter((r) => r.allocation > 0)
    .map(
      (r) =>
        `${r.label}: ${(weightsPct[r.id] ?? 0).toFixed(0)}% allocation, ${(r.priceImpact * 100).toFixed(2)}% price impact`
    )
    .join("; ");

  const be =
    portfolio.breakEvenYears != null && portfolio.breakEvenYears <= 10
      ? `\n- Break-Even Horizon: ${portfolio.breakEvenYears.toFixed(1)} years`
      : portfolio.breakEvenDisplay
        ? `\n- Break-Even Horizon: ${portfolio.breakEvenDisplay}`
        : "";

  return `
You are a financial analysis assistant helping a wealth management firm communicate fixed income portfolio risk.

PORTFOLIO DATA:
- Weighted Average Duration: ${portfolio.wad.toFixed(1)} years
- Portfolio Yield (estimated): ${(portfolio.portfolioYield * 100).toFixed(2)}%
- Portfolio Value: $${portfolio.effectivePortfolioValue.toLocaleString()}
- Asset Allocation: ${assetBreakdown}

STRESS SCENARIO APPLIED:
- Scenario Name: ${scenario.label}
- Scenario Description: ${scenario.description}
- Macro Context: ${scenario.macroContext}

CALCULATED RESULTS:
- Total Portfolio Price Impact: ${(portfolio.portfolioPriceImpact * 100).toFixed(2)}%
- Dollar Impact: $${Math.round(portfolio.portfolioDollarImpact).toLocaleString()}
- Estimated 1-Year Total Return: ${(portfolio.totalReturn * 100).toFixed(2)}%
${be}
- Biggest Impact Asset Class: ${portfolio.worstAsset.label} (${(portfolio.worstAsset.impact * 100).toFixed(2)}%)

INSTRUCTIONS:
Respond ONLY with a valid JSON object in this exact structure — no markdown, no preamble:

{
  "clientLetter": "...",
  "advisorBrief": "..."
}

CLIENT LETTER REQUIREMENTS:
- 150–200 words
- Written as if the advisor will send this to their client
- Warm, clear, zero jargon — no terms like "duration", "convexity", "basis points"
- Use plain language equivalents: "interest rate sensitivity", "bond prices tend to fall when rates rise"
- Must reference the actual calculated numbers (price impact %, dollar impact, portfolio yield)
- Structure: (1) What happened in the market scenario, (2) What it means for their portfolio specifically, (3) Income context, (4) What they should consider discussing with their advisor, (5) Brief reassurance
- Do NOT say the advisor is writing this — write it as the advisor's voice
- Do NOT use hollow phrases like "I hope this finds you well" or "I wanted to reach out"

ADVISOR BRIEF REQUIREMENTS:
- 200–250 words
- Technical, precise — use proper fixed income terminology
- Must include: duration analysis, specific asset class drivers, convexity commentary, break-even horizon (if applicable), 2–3 specific actionable considerations calibrated to THIS scenario
- If total return is positive (rally scenario), flip framing to "positioning to capture gains"
- Bold the key metrics inline using markdown: **X.X years**, **−8.4%**, etc.
- End with one forward-looking monitoring note
`.trim();
}

export interface GeminiDualOutput {
  clientLetter: string;
  advisorBrief: string;
}

/** Shown when VITE_GEMINI_API_KEY is missing or invalid — not model output. */
const PLACEHOLDER_ADVISOR_PREFIX = "Add your Gemini API key to .env.local";

export function isGeminiPlaceholderOutput(
  advisorBrief: string | null | undefined
): boolean {
  return Boolean(advisorBrief?.startsWith(PLACEHOLDER_ADVISOR_PREFIX));
}

export async function fetchGeminiAnalysis(
  prompt: string,
  _apiKey: string
): Promise<GeminiDualOutput> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (
    !apiKey ||
    apiKey === "your_key_here" ||
    apiKey.trim().length < 10
  ) {
    return {
      clientLetter:
        "Add your Gemini API key to .env.local as VITE_GEMINI_API_KEY to enable AI analysis. The calculated results above are fully functional without it.",
      advisorBrief:
        "Add your Gemini API key to .env.local as VITE_GEMINI_API_KEY to enable AI analysis. All financial calculations (duration, price impact, break-even, risk flags) run entirely in the browser and do not require an API key.",
    };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `HTTP ${response.status}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error("Empty response from model");
  }

  let parsed: unknown;
  try {
    parsed = parseModelJson(rawText);
  } catch {
    throw new Error("Malformed JSON from model");
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("clientLetter" in parsed) ||
    !("advisorBrief" in parsed)
  ) {
    throw new Error("Invalid JSON shape from model");
  }

  const o = parsed as { clientLetter: unknown; advisorBrief: unknown };
  if (typeof o.clientLetter !== "string" || typeof o.advisorBrief !== "string") {
    throw new Error("Invalid letter fields from model");
  }

  return { clientLetter: o.clientLetter, advisorBrief: o.advisorBrief };
}
