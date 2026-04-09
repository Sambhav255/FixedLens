# FixedLens — Product Requirements Document
### Fixed Income Portfolio Stress Tester
**Version 1.0 | For Cursor Build**

---

## 1. Product Overview

**What it is:** A professional-grade web application that lets financial advisors stress test a fixed income portfolio against rate shocks, yield curve shifts, credit events, and combined macro scenarios — and generates two AI-written outputs: a client-facing explanation and an advisor-facing analytical brief.

**The product insight:** Bloomberg gives advisors the numbers. Nobody gives them the words. The gap between "duration 6.2, down 8.4% in a +150bps scenario" and "here's how to explain this to your client" is real, daily, and unsolved. FixedLens closes that gap.

**Stack:** React + TypeScript, Tailwind CSS, Gemini API (gemini-2.0-flash), Vercel deployment.

**Target persona:** Financial advisor at a wealth management firm managing bond-heavy client portfolios. Also impressive to fixed income product builders (quants, PMs, engineers) who will instantly recognize the domain precision.

---

## 2. Visual Design Direction

**Aesthetic:** Refined Bloomberg-dark. Not a Bloomberg clone — something cleaner, more modern, less cluttered. Think: what Bloomberg would look like if it were redesigned today by a team that also uses Linear.

**Color palette (CSS variables):**
```css
--bg-primary: #0A0C10        /* near-black background */
--bg-surface: #111318        /* card / panel backgrounds */
--bg-elevated: #181C24       /* input fields, elevated surfaces */
--border: #1F2530            /* subtle borders */
--border-active: #2E3A4E     /* active/hover border */
--text-primary: #E8EDF5      /* primary text */
--text-secondary: #8A94A6    /* labels, secondary */
--text-muted: #4A5568        /* very muted / placeholders */
--accent-blue: #3B82F6       /* primary action color */
--accent-blue-dim: #1E3A5F   /* blue at low opacity */
--accent-green: #10B981      /* positive / gain */
--accent-red: #EF4444        /* negative / loss */
--accent-amber: #F59E0B      /* warning / neutral scenario */
--accent-purple: #8B5CF6     /* AI-generated content indicator */
```

**Typography:**
- Display / headings: `IBM Plex Mono` (monospaced, data-heavy feel, free on Google Fonts)
- Body / labels: `Inter` (clean, readable at small sizes)
- Numbers / metrics: `IBM Plex Mono` always — numbers in a dashboard should be monospaced

**Layout philosophy:** Dense but breathable. Three-column layout on desktop. Data-rich without feeling cluttered. Every pixel has a job.

**Micro-interactions:**
- Sliders update all calculations in real time with no button press required
- Numbers animate (count up/down) when scenario changes — use a simple easing function, 300ms
- Scenario cards have a hover state that reveals a one-line description
- AI output sections have a subtle purple shimmer loading state while Gemini responds
- Negative impact numbers pulse red once on first render

---

## 3. Layout Architecture

### Three-Column Desktop Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER: FixedLens logo + tagline + portfolio value input        │
├───────────────────┬───────────────────┬─────────────────────────┤
│  LEFT PANEL       │  CENTER PANEL     │  RIGHT PANEL            │
│  Portfolio        │  Scenario         │  Results                │
│  Builder          │  Selector         │  Dashboard              │
│                   │                   │                         │
│  [Presets]        │  [Category Tabs]  │  [Key Metrics]          │
│  [Sliders x6]     │  [Scenario Cards] │  [Asset Breakdown]      │
│  [Portfolio       │                   │  [Total Return Est.]    │
│   Summary]        │                   │                         │
├───────────────────┴───────────────────┴─────────────────────────┤
│  AI OUTPUT SECTION (full width, two tabs)                        │
│  [Client Letter] [Advisor Brief]                                 │
└─────────────────────────────────────────────────────────────────┘
```

Mobile: Stack vertically in order — Portfolio → Scenario → Results → AI Output.

---

## 4. Component Specifications

### 4.1 Header Bar

- **Logo:** `FixedLens` in IBM Plex Mono, size 18px, white. Small superscript beta tag.
- **Tagline:** `Fixed Income Stress Testing` in text-secondary, size 12px
- **Portfolio Value Input:** Right side of header. Label: `Portfolio Value`. Text input that accepts numbers, formats as `$X,XXX,XXX` on blur. Default: `$1,000,000`. This value is used only for dollar-denominated impact calculations — the math is all percentage-based.
- **Disclaimer chip:** Small grey chip reading `Illustrative only — simplified duration model` with a tooltip explaining it uses modified duration approximation, not full repricing.

---

### 4.2 Left Panel — Portfolio Builder

**Section header:** `PORTFOLIO` in uppercase IBM Plex Mono, text-muted, 11px, letter-spacing wide.

#### 4.2.1 Preset Portfolios

Five preset buttons displayed as small chips in a horizontal wrap:

| Label | Treasuries | IG Corp | High Yield | Munis | TIPS | MBS |
|-------|-----------|---------|-----------|-------|------|-----|
| Conservative Income | 30% | 30% | 5% | 25% | 0% | 10% |
| Moderate Growth | 20% | 40% | 15% | 15% | 10% | 0% |
| Aggressive Duration | 10% | 50% | 20% | 10% | 10% | 0% |
| Inflation Shield | 20% | 20% | 5% | 15% | 35% | 5% |
| High Yield Tilt | 5% | 20% | 50% | 10% | 5% | 10% |

Clicking a preset loads those values into the sliders. User can then adjust sliders freely after selecting a preset. Active preset chip highlights in accent-blue. If user modifies sliders after selecting a preset, the preset chip goes back to inactive state (their portfolio is now custom).

#### 4.2.2 Asset Class Sliders

Six sliders, one per asset class. Each row contains:
- **Asset class label** (left): Name + tooltip icon
- **Slider:** Range 0–100%, step 1%
- **Percentage value** (right): Current %, monospaced, updates in real time

Asset classes in this exact order:
1. US Treasuries
2. Investment Grade Corporate
3. High Yield Corporate
4. Municipal Bonds
5. TIPS
6. Mortgage-Backed Securities (MBS)

**Allocation enforcement:** Show a live total below the sliders. If total ≠ 100%, display in accent-red with message `Allocation: 87% — must total 100%`. Run button / AI generation is disabled when total ≠ 100%. Do NOT auto-normalize — let the user control it. This is intentional: force the user to think about their allocation.

**Tooltips on hover (asset class name):**
1. US Treasuries: "US government bonds. Highest credit quality. Rates-only sensitivity — no credit risk."
2. IG Corporate: "Investment-grade corporate bonds (BBB– and above). Sensitive to both rates and credit spreads."
3. High Yield Corporate: "Sub-investment grade bonds (BB+ and below). Higher income, significant credit spread sensitivity."
4. Municipal Bonds: "State and local government bonds. Tax-advantaged income. Moderate rate sensitivity."
5. TIPS: "Treasury Inflation-Protected Securities. Principal adjusts with CPI. Real rate sensitivity, inflation hedge."
6. MBS: "Mortgage-backed securities. Prepayment risk compresses effective duration in rate rallies."

#### 4.2.3 Portfolio Summary Card

Below the sliders, a summary card showing:
- **Weighted Average Duration:** `X.X years` — calculated in real time
- **Portfolio Yield (est.):** `X.XX%` — weighted average of current yield assumptions
- **Convexity (est.):** `XX.X` — weighted average of convexity assumptions
- **Credit Quality (est.):** Qualitative label calculated from allocation (see logic below)

Credit Quality label logic:
- If HY > 40%: "Below Investment Grade Tilt"
- If HY > 20%: "Moderate Credit Risk"
- If HY ≤ 20% and IG Corp > 30%: "Investment Grade"
- If Treasuries + Munis + TIPS > 60%: "High Quality / Government-Heavy"
- Default: "Blended"

---

### 4.3 Center Panel — Scenario Selector

**Section header:** `SCENARIO` in same style as Portfolio header.

Four category tabs:
1. **Rate Shocks** — parallel shifts across the yield curve
2. **Curve Shifts** — non-parallel movements (flattening, steepening)
3. **Credit Events** — spread widening scenarios
4. **Combined** — multi-factor stress scenarios

Each tab shows scenario cards. Only one scenario can be active at a time globally (not one per tab — selecting any scenario deselects the previous one across all tabs).

Active scenario card: border in accent-blue, subtle blue background tint.

#### Tab 1: Rate Shocks (6 scenarios)

| ID | Label | Description | Δy (all maturities) |
|----|-------|-------------|---------------------|
| RS1 | Hawkish Surprise | Fed signals higher-for-longer, rates reprice +100bps | +1.00% |
| RS2 | Tightening Cycle | Sustained Fed hikes, rates climb +200bps over 12 months | +2.00% |
| RS3 | 2022 Replay | Aggressive tightening — fastest rate cycle since 1980s | +3.00% |
| RS4 | Recession Rally | Growth scare triggers flight to safety, rates fall -100bps | -1.00% |
| RS5 | Crisis Rally | Financial stress, emergency cuts — 2008 / 2020 analog | -2.00% |
| RS6 | Mild Adjustment | Orderly normalization, rates move +50bps | +0.50% |

#### Tab 2: Curve Shifts (4 scenarios)

These apply **different Δy per asset class** based on where each asset typically sits on the yield curve. Values pre-calculated below.

| ID | Label | Description |
|----|-------|-------------|
| CS1 | Bear Flattener | Short rates +200bps, long rates +75bps — Fed hikes, market skeptical on growth |
| CS2 | Bear Steepener | Short rates +50bps, long rates +150bps — term premium expansion, fiscal concern |
| CS3 | Bull Steepener | Short rates -125bps (cuts), long rates -25bps — early easing cycle |
| CS4 | Yield Curve Inversion | Short rates +175bps, long rates +25bps — extreme inversion deepening |

**Pre-calculated effective Δy per asset class per curve scenario:**

Bear Flattener (CS1):
- Treasuries: +1.20% (mix of short and long exposure)
- IG Corp: +1.10% (intermediate-long maturity typical)
- HY: +1.60% (shorter duration, more front-end sensitive)
- Munis: +1.10% (intermediate)
- TIPS: +0.90% (longer real duration, less front-end)
- MBS: +1.40% (prepayment profile makes them short-intermediate)

Bear Steepener (CS2):
- Treasuries: +1.10%
- IG Corp: +1.30%
- HY: +0.70%
- Munis: +1.20%
- TIPS: +1.40%
- MBS: +0.90%

Bull Steepener (CS3):
- Treasuries: -0.60%
- IG Corp: -0.80%
- HY: -0.30%
- Munis: -0.75%
- TIPS: -0.90%
- MBS: -0.45%

Yield Curve Inversion (CS4):
- Treasuries: +0.80%
- IG Corp: +0.70%
- HY: +1.30%
- Munis: +0.70%
- TIPS: +0.40%
- MBS: +1.10%

#### Tab 3: Credit Events (4 scenarios)

These apply **spread widening on top of any rate movement**. Spread widening only affects credit-sensitive assets (IG Corp, HY, Munis — partial). Treasuries and TIPS are unaffected by credit spread widening.

| ID | Label | Description | IG Corp Spread Δ | HY Spread Δ | Munis Spread Δ | Rate Δ (all) |
|----|-------|-------------|-----------------|-------------|----------------|-------------|
| CE1 | Mild Credit Stress | Softening economy, spreads widen modestly | +75bps | +200bps | +25bps | +0.25% |
| CE2 | Moderate Downturn | Recession fears, IG and HY spreads reprice | +150bps | +400bps | +75bps | +0.00% |
| CE3 | 2020 COVID Shock | Sudden liquidity crisis — March 2020 analog | +250bps | +600bps | +150bps | -0.50% |
| CE4 | 2008 GFC Analog | Systemic stress, extreme HY dislocation | +400bps | +1500bps | +300bps | -1.00% |

**MBS in credit scenarios:** Add +50% of IG spread widening as additional MBS spread widening (MBS spread to Treasuries widens in credit stress due to liquidity premium).

#### Tab 4: Combined Scenarios (4 scenarios)

These combine rate movements + credit spread changes to reflect realistic macro environments.

| ID | Label | Description | Rate Δ | IG Spread Δ | HY Spread Δ |
|----|-------|-------------|--------|------------|------------|
| CB1 | Stagflation | Rates rise on inflation, credit stress from slowing growth | +200bps | +150bps | +300bps |
| CB2 | Hard Landing | Sharp Fed cuts but credit spreads blow out as recession deepens | -100bps | +200bps | +500bps |
| CB3 | Global Risk-Off | Dollar surge, geopolitical shock — rates down, credit out | -75bps | +175bps | +450bps |
| CB4 | Soft Landing (Base Case) | Gradual normalization — mild rate decline, spreads stable | -50bps | -25bps | -50bps |

---

### 4.4 Right Panel — Results Dashboard

Updates in real time whenever portfolio allocation or selected scenario changes. If no scenario is selected, show placeholder state ("Select a scenario to see impact").

#### 4.4.1 Key Metrics Row (top of results panel)

Four metric cards in a 2×2 grid:

**Card 1: Price Impact**
- Label: `PRICE IMPACT`
- Value: `−X.XX%` — red if negative, green if positive
- Subtext: Dollar amount: `−$XX,XXX` based on portfolio value input

**Card 2: Est. 1-Year Total Return**
- Label: `1-YEAR TOTAL RETURN (EST.)`
- Value: `X.XX%`
- Formula: Price impact + portfolio yield
- Subtext: `Includes income earned at current yields`

**Card 3: Weighted Avg Duration**
- Label: `PORTFOLIO DURATION`
- Value: `X.X yrs`
- Subtext: Changes under curve scenarios where effective duration shifts

**Card 4: Worst Asset Class**
- Label: `HIGHEST IMPACT`
- Value: Asset class name
- Subtext: `−X.XX%` impact for that slice

#### 4.4.2 Asset Class Breakdown Table

A table showing impact by asset class. Columns:
- Asset Class
- Allocation (%)
- Duration (yrs)
- Price Impact (%) — for this scenario
- Dollar Impact ($) — = allocation × portfolio value × price impact
- Contribution to Portfolio (%) — how much of total portfolio impact this asset drives

Color code the Price Impact column: red gradient intensity scales with severity of loss.

#### 4.4.3 Income Analysis Strip

Horizontal strip below the table:
- **Current Annual Income (est.):** `$XX,XXX` — portfolio value × portfolio yield
- **Post-Scenario Reinvestment Yield:** For rate-up scenarios, new income if portfolio is held and matures (yield + Δy applied to new purchases)
- **Break-Even Horizon:** Time for higher income to offset price loss. Formula: `|Price Impact| / |Δy on portfolio yield|` expressed in years. Display as `X.X years to break even` with tooltip explaining the concept.

#### 4.4.4 Risk Flag Bar

Three risk flags shown as coloured chips below the income strip:
- **Duration Risk:** LOW / MODERATE / HIGH / EXTREME — based on WAD threshold (< 3 = LOW, 3–6 = MODERATE, 6–9 = HIGH, > 9 = EXTREME)
- **Credit Risk:** same tiers — based on HY % (< 10% = LOW, 10–25% = MODERATE, 25–40% = HIGH, > 40% = EXTREME)
- **Concentration Risk:** LOW / MODERATE / HIGH — if any single asset class > 50% = HIGH, > 35% = MODERATE

---

### 4.5 AI Output Section (Full Width)

Appears below the three-column section. Full width of the page.

**Section header:** `AI ANALYSIS` with a small purple dot indicator pulsing while loading.

**Two tabs side by side:**

#### Tab A: Client Letter

**Label:** `Client-Facing` with a small icon (person/letter)

**Tone:** Warm, clear, no jargon. Written as if the advisor is preparing to email this to a client. Uses plain language to explain what the scenario means for them personally.

**Structure Gemini should follow (embed in prompt — see Section 6):**
1. One sentence acknowledging the scenario in plain English
2. Two sentences on what this means for their portfolio — use the actual calculated numbers
3. One sentence on income context (break-even, or why income still matters)
4. Two sentences on what the advisor recommends considering (without being too prescriptive — leave room for advisor judgment)
5. One reassuring closing sentence

**Word count target:** 150–200 words.

**UI elements:**
- Text renders in a clean card with slightly more line-height than normal (1.7)
- `Copy to clipboard` button top-right of card
- Small disclaimer below: `AI-generated draft — review before sending to clients`

#### Tab B: Advisor Brief

**Label:** `Advisor Brief` with a small icon (chart/analytics)

**Tone:** Analytical, precise, uses proper fixed income terminology. Written for the advisor themselves — someone who understands duration, convexity, spread duration, etc.

**Structure Gemini should follow:**
1. One sentence naming the scenario and its macro context
2. Portfolio duration and specific price impact with the exact numbers from calculation
3. Which asset classes are driving the loss (or gain) and why
4. Convexity note — whether convexity helps or hurts in this scenario
5. Break-even horizon analysis
6. Two to three specific, actionable considerations (rotate duration, add floating rate, add HY quality, etc.) — calibrated to the specific scenario
7. One sentence on what to monitor

**Word count target:** 200–250 words. Can use bolded subheadings within the brief for scannability.

**UI elements:**
- Same card style
- `Copy to clipboard` button
- No disclaimer needed on advisor brief tab
- If the numbers indicate a gain scenario (rally), the brief should acknowledge this and flip to "how to capture this" framing rather than defensive framing

**Shared behavior:**
- Both tabs load simultaneously from a single Gemini API call (prompt asks for both outputs in one JSON response — see Section 6)
- Loading state: purple shimmer across both cards simultaneously
- Error state: "Analysis unavailable — check API key" with a retry button
- Re-generates automatically when scenario changes (debounced 800ms to avoid hammering on rapid scenario switching)

---

## 5. Financial Math — Exact Formulas

All calculations are performed in the browser in real time. No server-side math.

### 5.1 Asset Class Parameters

Hardcode these as constants. These represent reasonable approximations for broad index exposures as of 2025–2026.

```typescript
interface AssetClassParams {
  label: string;
  modifiedDuration: number;   // years
  convexity: number;          // dollar convexity (used in price approximation)
  currentYield: number;       // decimal — approximate current yield
  spreadDuration: number;     // years — sensitivity to credit spread changes
  isRateOnly: boolean;        // true = not affected by credit spread widening
}

const ASSET_CLASSES: AssetClassParams[] = [
  {
    label: "US Treasuries",
    modifiedDuration: 6.0,
    convexity: 55,
    currentYield: 0.044,
    spreadDuration: 0,
    isRateOnly: true,
  },
  {
    label: "Investment Grade Corporate",
    modifiedDuration: 7.0,
    convexity: 52,
    currentYield: 0.051,
    spreadDuration: 6.8,
    isRateOnly: false,
  },
  {
    label: "High Yield Corporate",
    modifiedDuration: 3.5,
    convexity: 18,
    currentYield: 0.072,
    spreadDuration: 3.3,
    isRateOnly: false,
  },
  {
    label: "Municipal Bonds",
    modifiedDuration: 6.5,
    convexity: 50,
    currentYield: 0.035,       // pre-tax; tax-equivalent ~5.8% at 40% rate
    spreadDuration: 4.5,       // partial credit sensitivity
    isRateOnly: false,
  },
  {
    label: "TIPS",
    modifiedDuration: 7.5,
    convexity: 65,
    currentYield: 0.021,       // real yield; nominal ~4.2% with breakeven
    spreadDuration: 0,
    isRateOnly: true,
  },
  {
    label: "Mortgage-Backed Securities",
    modifiedDuration: 5.5,
    convexity: 35,             // lower convexity due to negative convexity from prepayment optionality
    currentYield: 0.055,
    spreadDuration: 4.0,       // spread to Treasuries, partially credit-sensitive
    isRateOnly: false,
  },
];
```

### 5.2 Price Impact Formula (per asset class)

**Step 1 — Rate component (applies to all asset classes):**

```
ΔP_rate / P = −ModDur × Δy_rate + 0.5 × Convexity × (Δy_rate)²
```

Where:
- `Δy_rate` = change in yield for this asset class in this scenario (in decimal, e.g. +1% = 0.01)
- `ModDur` = modified duration from constants above
- `Convexity` = convexity from constants above

Note on convexity sign: For MBS in a rate rally (Δy negative), apply a convexity haircut of 40% because MBS exhibit negative convexity (prepayments accelerate, shortening duration and capping price appreciation). If Δy < 0 and asset class is MBS: `effectiveConvexity = Convexity × 0.6`.

**Step 2 — Spread component (applies only to non-rate-only assets):**

```
ΔP_spread / P = −SpreadDur × ΔSpread
```

Where `ΔSpread` is the spread change for this asset class in this scenario (in decimal, e.g. +150bps = 0.015).

**Step 3 — Total price impact:**

```
ΔP_total / P = ΔP_rate / P + ΔP_spread / P
```

Express as a percentage. This is `priceImpact_i` for asset class i.

### 5.3 Portfolio-Level Calculations

**Weighted Average Duration:**
```
WAD = Σ (weight_i × modifiedDuration_i)
```

**Portfolio Price Impact:**
```
portfolioPriceImpact = Σ (weight_i × priceImpact_i)
```

**Portfolio Yield:**
```
portfolioYield = Σ (weight_i × currentYield_i)
```

**Annual Income:**
```
annualIncome = portfolioValue × portfolioYield
```

**Estimated 1-Year Total Return:**
```
totalReturn = portfolioPriceImpact + portfolioYield
```
(This is a simplified horizon return. For rate-up scenarios, income earned during the year partially offsets price loss. For a full horizon analysis you'd compound, but this approximation is standard and clearly labeled.)

**Break-Even Horizon:**
Only show for rate-shock scenarios where `portfolioPriceImpact < 0` and `Δy > 0` (rates went up, portfolio lost value but now earns more income).

```
breakEvenYears = |portfolioPriceImpact| / |portfolioYieldChange|
```

Where `portfolioYieldChange = WAD × avgΔy` (approximate change in portfolio yield if held to reinvestment). Cap display at "10+ years" if result > 10.

**Asset class contribution to total impact:**
```
contribution_i = (weight_i × priceImpact_i) / portfolioPriceImpact × 100
```
(Skip if portfolioPriceImpact = 0 to avoid divide-by-zero.)

**Dollar impact:**
```
dollarImpact_i = portfolioValue × weight_i × priceImpact_i
portfolioDollarImpact = portfolioValue × portfolioPriceImpact
```

### 5.4 Convexity (Portfolio Level)
```
portfolioConvexity = Σ (weight_i × convexity_i)
```
Display in the portfolio summary card.

---

## 6. Gemini API Integration

### 6.1 When to Call

Trigger a Gemini call whenever:
- The active scenario changes AND the portfolio allocation totals 100%
- The portfolio allocation changes AND a scenario is already selected AND total = 100%

Debounce: 800ms after last change before firing. Show loading state immediately on change.

### 6.2 Model and Setup

```typescript
const response = await fetch("https://api.anthropic.com/v1/messages", {
  // Wait — this is for Gemini. Use Gemini API directly:
});
```

Use Gemini API directly (not Anthropic API — this is a Gemini-powered app):

```typescript
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const response = await fetch(GEMINI_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    contents: [{ role: "user", parts: [{ text: buildPrompt(portfolioData, scenarioData, calculatedResults) }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
    }
  })
});
```

### 6.3 Prompt Template

```typescript
function buildPrompt(portfolio, scenario, results): string {
  const assetBreakdown = portfolio.allocations
    .filter(a => a.weight > 0)
    .map(a => `${a.label}: ${(a.weight * 100).toFixed(0)}% allocation, ${a.priceImpact.toFixed(2)}% price impact`)
    .join('; ');

  return `
You are a financial analysis assistant helping a wealth management firm communicate fixed income portfolio risk.

PORTFOLIO DATA:
- Weighted Average Duration: ${results.wad.toFixed(1)} years
- Portfolio Yield (estimated): ${(results.portfolioYield * 100).toFixed(2)}%
- Portfolio Value: $${results.portfolioValue.toLocaleString()}
- Asset Allocation: ${assetBreakdown}

STRESS SCENARIO APPLIED:
- Scenario Name: ${scenario.label}
- Scenario Description: ${scenario.description}
- Macro Context: ${scenario.macroContext}

CALCULATED RESULTS:
- Total Portfolio Price Impact: ${(results.portfolioPriceImpact * 100).toFixed(2)}%
- Dollar Impact: $${Math.round(results.portfolioDollarImpact).toLocaleString()}
- Estimated 1-Year Total Return: ${(results.totalReturn * 100).toFixed(2)}%
${results.breakEvenYears ? `- Break-Even Horizon: ${results.breakEvenYears.toFixed(1)} years` : ''}
- Biggest Impact Asset Class: ${results.worstAssetClass.label} (${(results.worstAssetClass.impact * 100).toFixed(2)}%)

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
`;
}
```

### 6.4 Response Parsing

```typescript
const rawText = response.candidates[0].content.parts[0].text;
const parsed = JSON.parse(rawText);
const clientLetter = parsed.clientLetter;
const advisorBrief = parsed.advisorBrief;
```

Handle parse errors gracefully — if JSON is malformed, show error state with retry button.

### 6.5 API Key Setup

Store in `.env.local`:
```
VITE_GEMINI_API_KEY=your_key_here
```

For Vercel deployment, add as Environment Variable in project settings.

---

## 7. State Management

Use React `useState` and `useMemo` — no external state library needed.

```typescript
interface AppState {
  allocations: Record<string, number>;    // assetClassId -> weight (0 to 1)
  portfolioValue: number;                 // default 1000000
  activeScenario: Scenario | null;
  activePreset: string | null;
  activeAITab: 'client' | 'advisor';
  aiOutput: { clientLetter: string; advisorBrief: string } | null;
  aiLoading: boolean;
  aiError: string | null;
}
```

All financial calculations are derived via `useMemo` from `allocations` + `activeScenario`. No calculations stored in state — always derived.

---

## 8. Scenario Data Structure

```typescript
interface Scenario {
  id: string;
  category: 'rate' | 'curve' | 'credit' | 'combined';
  label: string;
  description: string;           // 1–2 sentence UI description
  macroContext: string;          // fuller context for Gemini prompt
  rateShift: Record<string, number>;    // assetClassId -> Δy in decimal
  spreadShift: Record<string, number>;  // assetClassId -> ΔSpread in decimal (0 for rate-only)
}
```

For parallel rate shock scenarios, `rateShift` has the same value for all 6 asset class IDs. For curve scenarios, different values per asset class (use the pre-calculated values in Section 4.3).

---

## 9. Error States and Edge Cases

| Situation | Behavior |
|-----------|----------|
| Allocation ≠ 100% | Disable AI generation; show red allocation counter; results panel shows "Complete your allocation to run analysis" |
| All sliders at 0% | Same as above |
| Single asset class at 100% | Valid — run normally. Concentration risk flag shows HIGH |
| Portfolio value = 0 | Default to $1,000,000; show placeholder |
| Gemini API error | Show error card in AI section with retry button; keep calculated metrics visible |
| Gemini returns malformed JSON | Same error handling as API error |
| Mobile viewport | Stack layout, collapse panels into accordion sections |
| Very large rate shock on long-duration portfolio | Total return can be extremely negative — show it accurately, no capping |

---

## 10. Footer

Minimal footer with:
- `FixedLens` name
- `Built by Sambhav Lamichhane` with link to LinkedIn
- `View source on GitHub` with GitHub link
- Disclaimer: `FixedLens uses a simplified modified duration model for illustrative purposes. All outputs are estimates and should not be construed as investment advice. Yield and duration assumptions represent approximate market conditions as of 2025–2026 and will drift over time.`

---

## 11. Build and Deployment Checklist

### Local Setup
```bash
npm create vite@latest fixedlens -- --template react-ts
cd fixedlens
npm install
# Add Gemini API key to .env.local
npm run dev
```

### Dependencies
```bash
npm install tailwindcss @tailwindcss/vite
# No other external dependencies needed — all math is vanilla TS
```

### Tailwind Config Note
Configure the CSS variables from Section 2 in your `globals.css` as actual CSS custom properties, then use them in Tailwind via `bg-[var(--bg-primary)]` syntax or configure the Tailwind theme to reference them.

### Vercel Deployment
1. Push to GitHub
2. Connect repo to Vercel
3. Add `VITE_GEMINI_API_KEY` in Environment Variables
4. Deploy — zero config needed for Vite projects

### Google Fonts
Add to `index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
```

---

## 12. What Makes This Impressive to a Fixed Income Quant

Every detail below was deliberate and will be immediately recognizable to Moment's founding team:

1. **Asset class convexity differentiation** — MBS negative convexity haircut in rallies is correct and non-obvious. Most "finance tools" ignore convexity entirely.

2. **Curve scenario pre-calculation** — Bear flattener vs bear steepener applies different Δy per asset class based on duration bucketing. This is how fixed income desks actually think.

3. **Break-even horizon** — This is a real metric advisors use when explaining rate-up environments to clients. "You'll break even in 4.2 years if you hold" is exactly how LPL advisors talk to their clients.

4. **Spread duration vs modified duration** — Correctly separating rate sensitivity from spread sensitivity, and applying spread widening only to credit-sensitive assets, is precise. Treasuries and TIPS correctly show zero credit spread impact.

5. **The dual output** — Client letter + advisor brief is a product insight, not a technical one. It shows you understand the workflow: advisors need two things — their own analysis and client communication. Building both is the product thinking that separates you from someone who just builds a calculator.

6. **Stagflation and hard landing scenarios** — These are the scenarios fixed income desks are actively modeling right now. Including them shows you read the market, not just textbooks.
