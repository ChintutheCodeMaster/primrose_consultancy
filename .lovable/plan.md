
# Primrose IEC → "Shopify for IECs" — Same-Day Build

Build all of Phase A in this session, in order. Each step is a self-contained milestone you can preview immediately.

---

## Step 1 — Visual refresh (foundation)
- Update `src/index.css` design tokens: warmer neutrals, deep emerald accent, refined shadows, larger heading scale, tabular-nums for numbers.
- Update `tailwind.config.ts` to expose the new tokens.
- Refresh `StatCard` and chart palette to match.
- Brand the AI as **"Rose"** (avatar + name used everywhere).

## Step 2 — DB migration (single call, everything Phase A needs)
- `daily_briefs` (date, brief_json, generated_at) — cache AI briefs per day.
- `practice_settings` (practice_name, logo_url, brand_color, tagline) — used in PDFs + portal.
- `demo_seed` boolean column on `students`, `leads`, `advisors` — lets us seed and reset demo data.
- `university_logos` (name, logo_url, color) — for Acceptance Wall tiles.
- GRANTs + RLS on all new tables.

## Step 3 — Command Center (`/app` home)
Replace `pages/Index.tsx` body with `CommandCenter`:
- `AIDailyBrief` — calls new `ai-daily-brief` edge function (gemini-2.5-flash), cached daily.
- `PracticeHealthCards` — Pipeline $, Collected MTD, Active students, Acceptances YTD, each with sparkline.
- `AcceptanceWall` — animated mosaic of every acceptance (logo tile or initials + color). The signature moment.
- `NeedsAttention` — cold leads, missing docs, upcoming deadlines, unpaid invoices.
- `RecentWinsTicker` — scrolling line of latest acceptances/payments.

Reusable hooks: `usePracticeHealth`, `useAcceptances`, `useAttentionItems`.

## Step 4 — Demo entry (`/demo`)
- Public page with 3 cards: "Enter as Consultant", "Enter as Student", "Enter as Parent".
- Seed script (one-time button on the demo page, idempotent) inserts a fictional "Bright Path Advisors" practice: 30 students, 8 acceptances, 5 leads, 1 signed agreement, journey events. All tagged `demo_seed=true`.
- "Reset demo data" button.
- Demo banner persists across routes when in demo mode.

## Step 5 — Outcomes Intelligence (`/outcomes`)
- `OutcomesHeatmap` — students × universities matrix, colored by status.
- `CohortFunnel` — applied → accepted → enrolled per graduation year, with $ROI bar.
- `BenchmarkCards` — pulls from existing `benchmark_percentiles` ("78th percentile on top-30 acceptances").
- "Compare two students" side-by-side panel.
- "Download Outcomes Report" button → calls new `generate-practice-outcomes-pdf` edge function.

## Step 6 — AI Strategist upgrades
- `CollegeListAuditor` on each student page → `college-list-auditor` edge function (gemini-2.5-pro) returns reach/target/likely balance + 3 suggestions. Stored in `student_strategy_reviews`.
- `EssayCoachPanel` in `JourneyWritingLab` → streaming "Ask Rose" sidebar with 3 quick actions (stronger opening, tighten paragraph, tone check).
- "Generate Strategy Memo" button on student page → `generate-strategy-memo` edge function returns a 1-page PDF.

## Step 7 — Polish + verify
- Make sure every new page is responsive (overflow-x-hidden, vertical stacking on mobile).
- Add sidebar entries: "Command Center" (replaces Dashboard), "Outcomes".
- Smoke-test the `/demo` flow end-to-end.
- Update memory index with the new architecture pieces.

---

## What I'll skip today (still Phase B/C)
- Multi-tenant auth/orgs (Phase 2 of existing pivot plan).
- Marketplace/playbooks, in-app payments, public IEC profile pages.
- Real cross-IEC benchmark data (we use the existing seed percentiles as placeholder).

## Risks I'll handle inline
- University logos missing → fall back to colored tile with initials.
- Empty practice (new IEC or fresh demo before seed) → friendly onboarding state instead of empty charts.
- AI edge function failures → graceful "Rose is resting" placeholder, no broken UI.

---

## Deliverable at the end of this session
A single link — `/demo` → "Enter as Consultant" → Command Center with the Acceptance Wall animating in, Rose's daily brief at the top, working Outcomes page, working AI list auditor and essay coach. Shareable with your co-founder immediately.
