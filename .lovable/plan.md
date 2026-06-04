# Tier-3 Differentiators — Build Plan

Four features that turn the platform from "good CRM" into a "must-have" for IECs. Built in this order because each reuses data the previous one produces.

---

## 1. Deadline Radar (Dashboard)

**What the user sees:** a card at the top of `/app` Dashboard:
> ⏰ **12 deadlines in next 14 days** across **4 students**
> Next up: *Sarah Chen — Stanford REA (Nov 1)*
> [View all →]

Click → opens a drill-in drawer grouped by week, then by student, with quick links to the student record.

**Data:** uses existing `student_colleges` rows. Adds a `deadline_date` column if not already populated, plus `application_plan` enum (`ED`, `ED2`, `EA`, `REA`, `RD`, `Rolling`). Color-codes by urgency (red <7d, amber <14d, gray <30d).

**Where it lives:** new `<DeadlineRadar />` component on `Dashboard.tsx`, plus a `/deadlines` full-page view.

**Effort:** small. ~½ day.

---

## 2. AI Application Strategist

**What the user sees:** new "Strategy" tab on each student record. Top of the tab shows the student's academic profile (GPA, SAT/ACT, rigor, intended major) and their current college list with each college flagged **Reach / Target / Likely / Wildcard**. A button "Run AI Strategy Review" produces:

- **Balance verdict** — "Your list is 7 reach / 1 target / 1 likely — top-heavy. Add 2–3 targets."
- **Per-college reasoning** — why each was bucketed (admit rate vs student profile delta).
- **Gap flags** — missing financial-aid safety, missing geographic diversity, missing rolling-admission option, no test-optional schools given low test score, etc.
- **Suggested additions** — 3–5 named colleges that would balance the list, with a one-line rationale each.

Runs server-side via Lovable AI Gateway (`google/gemini-3-flash-preview` for speed, fall back to `gemini-2.5-pro` if user clicks "Deep review"). Result saved to `student_strategy_reviews` so consultants can compare versions over time.

**Ethical guardrail:** banner above output — "AI suggestions are a starting point, not a verdict. Always validate with current admit data."

**Data needed:**
- `student_profile_extras` already has GPA / test scores → reuse.
- New small seed table `college_reference` with ~500 popular US colleges + acceptance rate + median SAT (one-time scraped from public IPEDS / Common Data Set). Avoids hallucinated numbers.
- New table `student_strategy_reviews` (id, student_id, model, input_snapshot, output_json, created_at).

**Where it lives:** new tab on `StudentDetail`. Edge function `student-strategy`. No client-side prompts.

**Effort:** medium. ~1.5 days (most of it is seeding the college reference data cleanly).

---

## 3. Outcomes Report PDF

**What the user sees:** new page `/outcomes` with a year picker. Shows a live preview of a one-pager, plus "Download PDF" and "Share public link" buttons.

The one-pager (US Letter, branded with the consultant's logo + color):

```text
┌─────────────────────────────────────────────┐
│  [Logo]  Class of 2026 — Outcomes           │
│                                             │
│  47 students placed                         │
│  $2.1M in scholarships earned               │
│  92% admitted to a top-3 choice             │
│                                             │
│  Where they're going:                       │
│  ● Stanford ● MIT ● UPenn ● NYU ● Michigan  │
│  (+ 23 more — see back)                     │
│                                             │
│  Notable wins:                              │
│  • 4 Ivy League acceptances                 │
│  • Full-ride to Vanderbilt                  │
│  • Rhodes finalist                          │
│                                             │
│  [Consultant photo]  Want results like      │
│  these for your family? → primrose/jane     │
└─────────────────────────────────────────────┘
```

Generated server-side with the `pdf` skill (reportlab) so output is consistent across browsers. Consultant can toggle which stats to show, edit the "Notable wins" bullets, and pick which schools to feature.

**Data:** pulls from `students` (graduated this cycle), `accepted_universities`, `student_scholarships`. Scholarship $ aggregated from existing `student_scholarships.amount`.

**Where it lives:** new `/outcomes` route, edge function `generate-outcomes-pdf`, public share URL `/outcomes/share/:token` (view-only, no auth, like the journey portal).

**Effort:** medium. ~1 day.

---

## 4. Benchmarks (Anonymized, Opt-In)

**What the user sees:** new "Benchmarks" widget on Analytics page (only renders if user opted in):

> Your **conversion rate** is **34%** — top quartile is **41%**.
> Your **avg package** is **$8,400** — median is **$7,200**.
> Your **acceptance rate to top-50** is **62%** — median is **54%**.

Opt-in toggle in Settings → Privacy. Clear copy: "Share anonymized aggregate metrics to unlock benchmarks. We never share student names, school names, or any identifying info."

**How aggregation works:**
- Nightly edge function `compute-benchmark-metrics` runs per org, computes 6–8 metrics, writes to `org_benchmark_snapshots` (org_id, metric, value, period).
- Second function `compute-benchmark-percentiles` reads all opted-in snapshots, computes p25/p50/p75 per metric, writes to `benchmark_percentiles` (metric, period, p25, p50, p75, sample_size).
- Widget shows percentiles only when `sample_size >= 10` (otherwise "Not enough data yet — invite peers").

**Privacy:** no row-level data ever leaves the org. Only computed scalar metrics. Pre-Phase-2 (no real orgs yet) we ship the UI + table + opt-in flow, but percentiles stay hidden behind a "Coming soon — joins live when 10+ practices opt in" message.

**Effort:** medium. ~1 day for the metrics + UI; the network-effect part activates once Phase 2 multi-tenancy ships.

---

## Build order & rough effort

| # | Feature | Effort | Why this order |
|---|---|---|---|
| 1 | Deadline Radar | ½ day | Tiny win, immediate dashboard "wow", uses existing data |
| 2 | Outcomes PDF | 1 day | Pure marketing tool, no AI/seed-data complexity |
| 3 | AI Strategist | 1.5 days | Highest perceived value; needs college reference seed |
| 4 | Benchmarks | 1 day | Lays groundwork; visible value lights up after Phase 2 |

**Total: ~4 days of build.**

---

## Open questions before I start

1. **College reference seed** — OK to ship with ~500 most-applied-to US colleges from public IPEDS data, expandable later? Or do you want all ~2,500 from day one?
2. **Outcomes PDF** — should the public share link be one per cohort (e.g. Class of 2026) or one global "Outcomes" page that updates yearly?
3. **Strategist deep vs fast mode** — ship both, or just fast for v1?
4. **Benchmark metrics** — confirm the 6–8 metrics you'd want exposed (suggested: conversion rate, avg package, % admitted to top-50, % admitted to top-25, avg # apps per student, scholarship $ per student, % students with ED accept, ED accept rate).

Answer those and I'll build in the order above.
