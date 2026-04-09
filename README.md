# FixedLens

**Fixed income portfolio stress testing** in the browser. Allocate across core asset classes, apply rate shock, curve, and credit scenarios, and see duration-style price impacts, dollar P/L, income estimates, and optional **Gemini-powered** client letters and advisor briefs.

Live logic uses a **modified duration + convexity** approximation (and spread duration where relevant). Outputs are **illustrative**, not investment advice.

Repository: [github.com/Sambhav255/FixedLens](https://github.com/Sambhav255/FixedLens)

---

## Features

- **Portfolio builder** — Six asset classes with presets and sliders; weighted average duration (WAD), yield, and convexity summary.
- **Scenarios** — Rate shocks, curve shifts, credit events, and combined stresses with clear macro context.
- **Results** — Portfolio and per-asset price impact, $ impact, 1-year total return estimate, break-even horizon (where applicable), risk tier badges.
- **AI analysis** (optional) — Draft client letter + technical advisor brief via Google Gemini when `VITE_GEMINI_API_KEY` is set; graceful messaging when it is not.
- **Responsive layout** — Three-column desktop workflow; accordion panels on small screens.

---

## Tech stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite 6](https://vitejs.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/) (via `@tailwindcss/vite`)

---

## Prerequisites

- **Node.js** 20+ (recommended)
- **npm** 10+
- **[Google AI Studio API key](https://aistudio.google.com/apikey)** — optional; only for AI-generated copy

---

## Quick start

```bash
git clone https://github.com/Sambhav255/FixedLens.git
cd FixedLens
npm install
cp .env.example .env.local
```

Edit `.env.local`:

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_GEMINI_API_KEY` | No | Enables AI client letter + advisor brief. If unset or invalid, calculated metrics still work. |
| `VITE_LINKEDIN_URL` | No | Optional footer link |
| `VITE_GITHUB_URL` | No | Optional footer link |

```bash
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

### Production build

```bash
npm run build
npm run preview   # optional: local preview of dist/
```

Deploy the `dist/` folder to any static host (e.g. Vercel, Netlify, GitHub Pages). Set environment variables in the host’s dashboard for production builds.

---

## Security note (API keys)

`VITE_*` variables are **inlined into the client bundle**. Treat any deployed Gemini key as **public**; restrict it in [Google AI Studio](https://aistudio.google.com/) (e.g. HTTP referrers, bundle IDs). For production, prefer a **server-side** proxy to hide the key and enforce quotas.

---

## Project layout

```
├── public/
├── src/
│   ├── components/     # UI panels (portfolio, scenario, results, AI)
│   ├── constants/      # Asset params, presets, scenarios
│   ├── lib/            # pricing, Gemini, formatting, risk labels
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.example
├── FixedLens_PRD.md   # Detailed product / design spec
└── vite.config.ts
```

---

## Disclaimer

FixedLens uses simplified fixed income approximations for **education and demonstration**. It is **not** a full valuation or risk system and **not** investment advice. Consult a qualified professional before making investment decisions.

---

## License

MIT — see [LICENSE](./LICENSE).

---

Built by **Sambhav Lamichhane**.
