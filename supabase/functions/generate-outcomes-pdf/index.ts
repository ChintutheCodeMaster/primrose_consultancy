// supabase/functions/generate-outcomes-pdf/index.ts
// Returns an HTML one-pager ready to print/save as PDF (browser handles PDF rendering).
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function esc(s: string | number | null | undefined): string {
  if (s === null || s === undefined) return "";
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function buildHtml(opts: {
  year: number;
  brandName: string;
  brandColor: string;
  stats: { studentsPlaced: number; scholarshipsTotal: number; topChoicePct: number };
  topSchools: string[];
  highlights: string[];
  shareUrl?: string;
}): string {
  const fmtMoney = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(opts.brandName)} — Class of ${opts.year}</title>
<style>
:root { --brand: ${esc(opts.brandColor)}; }
* { box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; background: #f8fafc; color: #0f172a; }
.page { width: 8.5in; min-height: 11in; margin: 24px auto; background: white; padding: 0.75in; box-shadow: 0 4px 24px rgba(0,0,0,0.08); position: relative; }
.bar { height: 8px; background: var(--brand); border-radius: 4px; margin-bottom: 24px; }
h1 { font-size: 28px; margin: 0 0 4px 0; }
.sub { color: #64748b; font-size: 14px; margin-bottom: 32px; }
.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
.stat { background: #f1f5f9; border-radius: 12px; padding: 20px; text-align: center; }
.stat .v { font-size: 32px; font-weight: 700; color: var(--brand); line-height: 1; }
.stat .l { font-size: 12px; color: #64748b; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
h2 { font-size: 16px; text-transform: uppercase; letter-spacing: 1px; color: #475569; border-bottom: 2px solid var(--brand); padding-bottom: 6px; margin-top: 32px; margin-bottom: 16px; }
.schools { display: flex; flex-wrap: wrap; gap: 8px; }
.school { background: white; border: 1px solid #e2e8f0; padding: 6px 14px; border-radius: 999px; font-size: 13px; font-weight: 500; }
ul.wins { padding-left: 20px; margin: 0; }
ul.wins li { margin-bottom: 8px; font-size: 14px; }
.footer { position: absolute; bottom: 0.5in; left: 0.75in; right: 0.75in; display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
.footer .brand { font-weight: 700; color: var(--brand); }
.btn { position: fixed; top: 12px; right: 12px; background: var(--brand); color: white; padding: 10px 18px; border-radius: 8px; cursor: pointer; font-weight: 600; border: 0; }
@media print {
  body { background: white; }
  .page { box-shadow: none; margin: 0; width: auto; min-height: auto; }
  .btn { display: none; }
}
</style></head><body>
<button class="btn" onclick="window.print()">Save as PDF</button>
<div class="page">
  <div class="bar"></div>
  <h1>${esc(opts.brandName)}</h1>
  <div class="sub">Class of ${opts.year} — Outcomes Report</div>

  <div class="stats">
    <div class="stat"><div class="v">${opts.stats.studentsPlaced}</div><div class="l">Students placed</div></div>
    <div class="stat"><div class="v">${fmtMoney.format(opts.stats.scholarshipsTotal)}</div><div class="l">Scholarships earned</div></div>
    <div class="stat"><div class="v">${opts.stats.topChoicePct}%</div><div class="l">Admitted to a top choice</div></div>
  </div>

  ${opts.topSchools.length ? `<h2>Where they're going</h2><div class="schools">${opts.topSchools.map((s) => `<span class="school">${esc(s)}</span>`).join("")}</div>` : ""}

  ${opts.highlights.length ? `<h2>Notable wins</h2><ul class="wins">${opts.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}

  <div class="footer">
    <span>Generated ${new Date().toLocaleDateString()}</span>
    <span class="brand">${esc(opts.brandName)}${opts.shareUrl ? ` · ${esc(opts.shareUrl)}` : ""}</span>
  </div>
</div>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    let year: number;
    let token: string | null = url.searchParams.get("token");
    let config: any = {};

    if (req.method === "POST") {
      const body = await req.json();
      year = body.year;
      config = body.config || {};
    } else {
      year = Number(url.searchParams.get("year") || new Date().getFullYear());
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (token) {
      const { data: tok } = await supabase
        .from("outcomes_share_tokens")
        .select("cohort_year, config, status")
        .eq("token", token)
        .maybeSingle();
      if (!tok || tok.status !== "active") {
        return new Response("Link expired or not found", { status: 404, headers: corsHeaders });
      }
      year = tok.cohort_year;
      config = tok.config || {};
    }

    // Pull cohort data
    const { data: students } = await supabase
      .from("students")
      .select("id, name, graduation_year, accepted_universities(university_name), applied_universities(university_name, status)")
      .eq("graduation_year", year);

    const cohort = students || [];
    const studentsPlaced = cohort.length;

    const { data: scholarships } = await supabase
      .from("student_scholarships")
      .select("amount, student_id, students!inner(graduation_year)")
      .eq("students.graduation_year", year);
    const scholarshipsTotal = (scholarships || []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0);

    const schoolSet = new Set<string>();
    for (const s of cohort as any[]) {
      for (const u of s.accepted_universities || []) schoolSet.add(u.university_name);
    }
    const topSchools = (config.featuredSchools && config.featuredSchools.length
      ? config.featuredSchools
      : Array.from(schoolSet)
    ).slice(0, 18);

    const html = buildHtml({
      year,
      brandName: config.brandName || "Primrose IEC",
      brandColor: config.brandColor || "#0f172a",
      stats: {
        studentsPlaced,
        scholarshipsTotal,
        topChoicePct: config.topChoicePct ?? 90,
      },
      topSchools,
      highlights: config.highlights || [
        `${schoolSet.size} unique universities across the cohort`,
      ],
      shareUrl: config.shareUrl,
    });

    return new Response(html, {
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (e) {
    console.error(e);
    return new Response(`Error: ${(e as Error).message}`, { status: 500, headers: corsHeaders });
  }
});
