---
name: multi-pov-review
description: >
  Run a structured multi-perspective review of any codebase, feature, component,
  or product decision. Use this skill whenever the user asks to "review", "audit",
  "stress test", "what am I missing", "is this production-ready", "what could go wrong",
  "think through trade-offs", "polish this", or wants a second opinion on any aspect
  of their project — technical, product, UX, security, or otherwise. Also trigger
  when the user shares a significant new feature, a new project, or asks "what should
  I work on next." This skill replaces the need to prompt each perspective separately.
  It is general-purpose and works for web apps, APIs, CLIs, data pipelines, and any
  other software project.
---

# Multi-POV Review Skill

## Purpose

Run a structured, token-efficient review of any project artifact (feature, component,
architecture, PR, or full codebase) through the lenses of the people who would
scrutinize it in a real company. Surface the highest-priority issues first.
Produce a triage output by default; expand only where severity demands it.

---

## When This Skill Is Called

The user has shared one of:
- A feature, component, or file to review
- A product or architecture decision to evaluate  
- A project and a question like "what should I work on next" or "is this ready"
- A request to think through trade-offs

Read what was shared carefully before running any perspective. Context determines
which POVs are most relevant and how deep to go.

---

## Step 0 — Calibrate Scope (do this first, silently)

Before writing any output, answer these three questions internally:

1. **What is the artifact?** (UI component / API / full app / data model / config / other)
2. **What is the user's goal?** (ship fast / polish / production-readiness / architecture decision / debugging)
3. **How much exists to review?** (single file / feature / whole codebase)

Use these answers to select which POVs to activate and how deep to go.
Do not ask the user clarifying questions unless the artifact is completely ambiguous.
Default to reviewing what you can see.

---

## Step 1 — Triage Pass (always run this)

Output a triage table. One row per active POV. Maximum 10 rows.
Each row: **POV name | Severity | One-line finding**.

Severity levels:
- 🔴 **Critical** — blocks shipping, causes data loss, security hole, broken core flow
- 🟡 **Important** — degrades experience, creates tech debt, likely to cause bugs
- 🟢 **Polish** — nice to have, improvements that elevate quality
- ⬜ **Clear** — no issues found in this dimension

Format:
```
| POV              | Severity | Finding                                              |
|------------------|----------|------------------------------------------------------|
| Security         | 🔴       | API key exposed in client-side bundle                |
| UX — First Visit | 🟡       | Empty state shows raw error object to new users      |
| Performance      | 🟢       | Table rerenders on every keystroke — add useMemo     |
| Accessibility    | ⬜       | Keyboard navigation and ARIA labels look solid       |
```

---

## Step 2 — Deep Dive (only for 🔴 Critical and 🟡 Important findings)

After the triage table, expand each 🔴 and 🟡 finding with:

**[POV Name] — [Finding title]**
- **What:** Specific description of the issue, with file/line reference if possible
- **Why it matters:** Impact if unaddressed (user impact, security risk, maintenance cost)
- **Fix:** The minimal correct solution. Code snippet if under 10 lines. Otherwise describe the approach.
- **Effort:** XS / S / M / L

Do NOT expand 🟢 Polish items in Step 2. List them compactly at the end.

---

## Step 3 — Polish List (compact, always include)

After the deep dives, a flat bulleted list of all 🟢 items.
One line each. Maximum 8 items. No explanations unless the fix is non-obvious.

Example:
```
Polish:
• Add loading skeleton to the data table (currently shows blank space)
• Truncate long asset names with ellipsis + title tooltip instead of wrapping
• Methodology footnote font-size should match other captions (currently inconsistent)
• Add aria-label to icon-only buttons
```

---

## Step 4 — What To Do Next (always include, maximum 5 lines)

A prioritized action list. Ordered by: Critical first, then Important, then Polish.
Each item is one sentence. Reference the finding by name.

Example:
```
Next actions (priority order):
1. Fix the API key exposure (Security — Critical) before any public deployment
2. Replace raw error object with a user-facing empty state message (UX)
3. Add useMemo to the table component to eliminate keystroke rerenders (Performance)
4. Work through the Polish list during the next cleanup pass
```

---

## POV Definitions

Activate the relevant subset based on the artifact. Do not activate all POVs for
every review — match them to what's present. A CLI tool does not need a "First-time
User" POV. A landing page does not need a "Data Pipeline" POV.

---

### 🏗 Architect
**Activate when:** The review involves system design, component boundaries, data flow,
API contracts, or technology choices.

Look for:
- Tight coupling that will make future changes expensive
- Missing abstractions (copy-pasted logic that should be a shared utility)
- Wrong layer doing wrong work (business logic in UI, presentation logic in DB queries)
- Scalability ceiling — what breaks at 10x current load
- Dependency choices — are they maintained, appropriately scoped, not over-engineered
- State management — is the right amount of state in the right place

Questions to ask internally:
- If this grows by 10x, what's the first thing that breaks?
- Where will the next developer get confused about what belongs where?
- Is this the simplest design that could work, or is it over-engineered?

---

### 🐛 Debugger
**Activate when:** There is existing code to review, especially anything with async
operations, state mutations, API calls, or complex logic.

Look for:
- Unhandled promise rejections and missing try/catch
- Race conditions (concurrent state updates, missing cleanup on useEffect)
- Off-by-one errors in loops, array indexing, date math
- Null/undefined access without guards
- Silent failures (errors swallowed, logs suppressed)
- Memory leaks (event listeners not removed, intervals not cleared)
- Edge cases on empty arrays, zero values, very large values

Do not list every possible edge case — focus on the ones most likely to occur
given the actual usage pattern of this artifact.

---

### 🔒 Security
**Activate when:** The artifact handles user input, authentication, API keys,
environment variables, external data, file uploads, or user-generated content.

**Always check for these regardless of other context:**
- API keys or secrets in client-side code or version-controlled files
- Unvalidated or unsanitized user input
- XSS vectors (dangerouslySetInnerHTML, innerHTML, eval)
- CORS misconfiguration
- Auth checks missing or bypassable
- Sensitive data in URLs, logs, or local storage

Security findings are always 🔴 Critical if exploitable. No exceptions.

---

### ⚡ Performance
**Activate when:** The artifact renders lists, processes data, makes network requests,
or has user interactions that need to feel instant.

Look for:
- Unnecessary rerenders (missing memo, missing stable references)
- N+1 query patterns or waterfall network requests
- Large bundle inclusions for small use cases
- Blocking the main thread (synchronous heavy computation)
- Unvirtualized large lists
- Images without lazy loading or size hints

Only flag performance issues that are observable by users or will become observable
at realistic scale. Do not flag theoretical micro-optimizations.

---

### 🎨 UX — Experienced User
**Activate when:** There is a UI to review.

This POV represents someone who uses the product regularly and cares about efficiency.

Look for:
- Unnecessary steps or clicks to accomplish common tasks
- Missing keyboard shortcuts for power users
- Feedback missing after actions (no confirmation, no error message, no loading state)
- Inconsistent interaction patterns (some things save automatically, others don't)
- Information density problems (too sparse = wasteful, too dense = overwhelming)
- Labels or copy that are accurate but confusing

---

### 👤 UX — First-time User
**Activate when:** There is a UI that a new user might encounter, especially on
landing pages, onboarding flows, empty states, or error states.

Look for:
- Empty states that show nothing instead of explaining what to do
- Error messages that expose implementation details (stack traces, "undefined")
- Jargon in labels that requires domain knowledge to understand
- No immediate value — the user has to do work before seeing anything useful
- Unclear call to action — more than one obvious next step, or zero

---

### ♿ Accessibility
**Activate when:** There is a UI to review.

Check for:
- Interactive elements without keyboard access (click-only)
- Images and icons without alt text or aria-label
- Color used as the only differentiator (colorblind users)
- Form inputs without labels
- Focus management after modal open/close
- Contrast ratios on custom color combinations

Flag only real violations, not theoretical ones. If the component is clearly
keyboard-navigable and labeled, mark as ⬜ Clear.

---

### 📦 Maintainability
**Activate when:** The codebase has more than one file and will be worked on again.

Look for:
- Functions or components longer than ~80 lines with multiple responsibilities
- Magic numbers and strings with no named constants
- Missing or misleading comments on non-obvious logic
- Inconsistent naming conventions across files
- Tests missing for logic that is non-trivial
- Dead code that is no longer called

---

### 🚀 Product
**Activate when:** The user is making decisions about what to build, what to prioritize,
or how to position a feature. Also activate when reviewing something built to impress
a specific audience (a demo, a portfolio piece, a cold outreach artifact).

Look for:
- Features that don't serve the core use case
- Missing features that users will immediately notice as absent
- The "so what" — is the value proposition clear and immediate
- Scope creep — things added because they were interesting, not because they were needed
- Positioning — does the artifact clearly communicate what it is and who it's for

If this is a demo or portfolio piece, also evaluate: does it pass the 10-second test
(does someone unfamiliar with it immediately understand what it is and why it's impressive)?

---

### 🔧 DevOps / Deployment
**Activate when:** The artifact includes deployment configuration, environment variable
handling, build scripts, CI/CD setup, or is being prepared for a public deployment.

Look for:
- Secrets that should be environment variables but are hardcoded
- Missing .gitignore entries for sensitive files
- No build error handling
- Missing health check or graceful shutdown
- No rate limiting on public endpoints
- Missing documentation for required environment variables

---

## Token Discipline Rules

These are hard constraints — follow them even when there is a lot to say.

1. **Triage table maximum: 10 rows.** If more than 10 POVs have findings, combine
   related findings or drop lower-severity ones. The table must be scannable.

2. **Deep dive maximum: 3 Critical + 4 Important.** If there are more Critical findings
   than 3, list the extras as one-liners after the main deep dives.
   If there are more Important findings than 4, same treatment.

3. **No finding gets more than 150 words in Step 2.** If a fix requires more explanation
   than that, link to the relevant section of the code and describe the approach.
   Do not write tutorials inside a review.

4. **Polish list maximum: 8 items.** Ruthlessly prioritize. If there are 20 polish
   items, pick the 8 that would have the most visible impact.

5. **Next actions list maximum: 5 items.** One sentence each.
   If it's longer than 5 lines, it's a project plan, not a next-actions list.

6. **Do not repeat yourself.** If a finding appears in the triage table,
   it does not get restated in the deep dive intro. Jump straight to What/Why/Fix.

---

## Output Format

```
## Review: [artifact name or brief description]
*[one sentence describing what was reviewed and from which POVs]*

### Triage
[table]

---

### Critical & Important Findings

[deep dives for 🔴 and 🟡 items only]

---

### Polish
[bulleted list]

---

### Next Actions
[numbered priority list]
```

---

## Edge Cases

**If the artifact is a single small file (<50 lines):**
Skip the deep dive format. Produce just the triage table + a compact combined
findings section (no headers per finding, just clear paragraphs). Keep under 300 words total.

**If everything looks good (all ⬜ Clear):**
Say so directly. "This looks solid — no significant issues across [POVs reviewed].
Minor polish items: [list]." Do not manufacture findings.

**If the user asks for one specific POV only:**
Run only that POV and produce a focused output (no triage table needed, just the
deep dive for that POV). Still respect the 150-word cap per finding.

**If the user asks "what should I work on next" without sharing an artifact:**
Ask them to share the relevant code or describe the current state. Do not guess.

**If the same issue appears across multiple POVs (e.g., missing error handling
is both a Debugger and a UX finding):**
Report it once under the most relevant POV. Note the secondary impact in parentheses.
Example: "Unhandled API error (Debugger — also affects UX: users see a blank screen)"

---

## Reminder

This skill is general-purpose. The POVs activated and the depth of each review
should always be calibrated to the specific artifact. A 20-line utility function
needs 3 minutes of review, not 30. A production deployment checklist needs
the full treatment. Use judgment.
