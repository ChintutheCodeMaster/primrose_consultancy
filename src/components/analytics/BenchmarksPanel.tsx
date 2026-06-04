import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { TrendingUp, Lock } from "lucide-react";

const METRIC_LABELS: Record<string, { label: string; format: (n: number) => string }> = {
  conversion_rate: { label: "Conversion rate", format: (n) => `${Math.round(n * 100)}%` },
  avg_package: { label: "Avg package", format: (n) => `$${Math.round(n).toLocaleString()}` },
  acceptance_top50: { label: "Acceptance rate to top-50", format: (n) => `${Math.round(n * 100)}%` },
  acceptance_top25: { label: "Acceptance rate to top-25", format: (n) => `${Math.round(n * 100)}%` },
  apps_per_student: { label: "Avg apps per student", format: (n) => n.toFixed(1) },
  scholarship_per_student: { label: "Scholarship $ per student", format: (n) => `$${Math.round(n).toLocaleString()}` },
  ed_admit_rate: { label: "ED acceptance rate", format: (n) => `${Math.round(n * 100)}%` },
  pct_with_ed_accept: { label: "% students with ED accept", format: (n) => `${Math.round(n * 100)}%` },
};

export function BenchmarksPanel() {
  const [optedIn, setOptedIn] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [myMetrics, setMyMetrics] = useState<Record<string, number>>({});
  const [percentiles, setPercentiles] = useState<Record<string, { p25: number; p50: number; p75: number; n: number }>>({});

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.from("org_benchmark_settings").select("*").limit(1).maybeSingle();
      if (s) {
        setSettingsId(s.id);
        setOptedIn(!!s.opted_in);
        setMyMetrics((s.metrics as any) || {});
      }
      const { data: p } = await supabase.from("benchmark_percentiles").select("*");
      const map: any = {};
      for (const r of (p || []) as any[]) {
        map[r.metric] = { p25: r.p25, p50: r.p50, p75: r.p75, n: r.sample_size };
      }
      setPercentiles(map);
    })();
  }, []);

  const computeMyMetrics = async () => {
    // Conversion: students / (students + leads)
    const [{ count: studentCount }, { count: leadCount }, studentsRes, scholarshipsRes] = await Promise.all([
      supabase.from("students").select("*", { count: "exact", head: true }).eq("did_not_continue", false),
      supabase.from("leads").select("*", { count: "exact", head: true }),
      supabase.from("students").select("package_cost, amount_paid").eq("did_not_continue", false),
      supabase.from("student_scholarships").select("amount"),
    ]);

    const sc = studentCount || 0;
    const lc = leadCount || 0;
    const conversion_rate = sc + lc > 0 ? sc / (sc + lc) : 0;

    const pkgs = ((studentsRes.data as any[]) || [])
      .map((r) => Number(r.package_cost) || Number(r.amount_paid) || 0)
      .filter((n) => n > 0);
    const avg_package = pkgs.length ? pkgs.reduce((a, b) => a + b, 0) / pkgs.length : 0;

    const scholarshipTotal = ((scholarshipsRes.data as any[]) || []).reduce(
      (s, r) => s + (Number(r.amount) || 0),
      0,
    );
    const scholarship_per_student = sc > 0 ? scholarshipTotal / sc : 0;

    const metrics = {
      conversion_rate,
      avg_package,
      scholarship_per_student,
      acceptance_top50: 0,
      acceptance_top25: 0,
      apps_per_student: 0,
      ed_admit_rate: 0,
      pct_with_ed_accept: 0,
    };

    const payload = { opted_in: true, metrics, last_computed_at: new Date().toISOString() };
    if (settingsId) {
      await supabase.from("org_benchmark_settings").update(payload).eq("id", settingsId);
    } else {
      const { data } = await supabase
        .from("org_benchmark_settings")
        .insert(payload)
        .select("id")
        .single();
      if (data) setSettingsId(data.id);
    }
    setMyMetrics(metrics);
    setOptedIn(true);
  };

  const toggleOptIn = async (next: boolean) => {
    if (next) {
      await computeMyMetrics();
    } else {
      if (settingsId) await supabase.from("org_benchmark_settings").update({ opted_in: false }).eq("id", settingsId);
      setOptedIn(false);
    }
  };

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Practice Benchmarks</h3>
            <p className="text-xs text-muted-foreground max-w-md">
              Share anonymized aggregate metrics to unlock how your practice compares. We never share student names,
              school names, or any identifying info.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{optedIn ? "Sharing" : "Off"}</span>
          <Switch checked={optedIn} onCheckedChange={toggleOptIn} />
        </div>
      </div>

      {!optedIn ? (
        <div className="text-center py-8 text-muted-foreground">
          <Lock className="h-6 w-6 mx-auto mb-2 opacity-60" />
          <p className="text-sm">Opt in to see how your practice stacks up against peers.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {Object.entries(METRIC_LABELS).map(([key, def]) => {
            const mine = myMetrics[key];
            const p = percentiles[key];
            const enoughData = p && p.n >= 10;
            return (
              <div key={key} className="rounded-lg border p-3">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{def.label}</div>
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {mine !== undefined ? def.format(mine) : "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">Your practice</div>
                  </div>
                  <div className="text-right text-xs">
                    {enoughData ? (
                      <>
                        <div className="text-muted-foreground">
                          p50 <span className="text-foreground font-medium">{def.format(p.p50)}</span>
                        </div>
                        <div className="text-muted-foreground">
                          p75 <span className="text-foreground font-medium">{def.format(p.p75)}</span>
                        </div>
                      </>
                    ) : (
                      <span className="text-muted-foreground/70 italic">
                        Activates at 10+ practices
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {optedIn && (
        <div className="text-right mt-3">
          <Button variant="ghost" size="sm" onClick={computeMyMetrics}>
            Recompute now
          </Button>
        </div>
      )}
    </Card>
  );
}
