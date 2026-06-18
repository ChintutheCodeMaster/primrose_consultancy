## Goal

Broaden the landing-facing positioning away from "IEC" / "IECA-coded" language so the product reads as built for **all** private admissions consultants — IECA members, HECA members, solo college counselors, boutique firms, essay coaches, international agents — not just one association.

I'll keep the brand name **"Primrose"** (drop the "IEC" suffix) and rewrite copy to use neutral, inclusive terms.

## Terminology swap

| Before | After |
|---|---|
| Primrose IEC | Primrose |
| Independent Educational Consultants | private admissions consultants / college counselors |
| IECs | consultants / advisors |
| Solo IEC | Solo consultant |
| Cross-border IEC | Cross-border advisor |
| "Enter as an IEC" | "Enter as a Consultant" |

## Files to change (LP + entry surfaces only)

1. **`index.html`** — title, author, og:title, JSON-LD `name`. New title: `Primrose — CRM for private admissions consultants`.
2. **`src/pages/Landing.tsx`** —
   - Logo line: drop the "IEC" subscript, just "Primrose".
   - Pain paragraph (~line 116): "Most admissions consultants run their practice on a patchwork…".
   - Testimonial roles: "Solo consultant, undergraduate admissions" / "Cross-border advisor".
   - Footer: "© {year} Primrose — The admissions practice operating system".
   - Any other "IEC" instance in hero/sections gets the neutral phrasing.
3. **`src/pages/SignIn.tsx`** —
   - Card label: `Enter as a Consultant`.
   - Page title: `Sign in · Primrose`.

## Out of scope (intentionally left alone)

- Internal app screens, sidebar, agreements, advisor portal, password gate, export filenames, and other files where "IEC" appears as internal labeling. Those aren't user-acquisition surfaces and changing them risks touching live consultant/student-facing workflows. We can do a second pass on those once you're happy with the LP wording.
- Memory index still says "Primrose IEC" — I'll update the core memory line to drop "IEC" so future sessions use the new positioning.

## Result

Landing page, `<head>` metadata, and Sign-in entry all read as a neutral product for any private admissions consultant. No association-coded language remains on acquisition surfaces.