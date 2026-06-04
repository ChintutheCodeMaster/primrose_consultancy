import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, AlertTriangle, Loader2, History } from "lucide-react";
import { toast } from "sonner";

type Review = {
  id: string;
  mode: string;
  output_json: any;
  created_at: string;
};

const bucketColor: Record<string, string> = {
  reach: "bg-red-100 text-red-700 border-red-200",
  target: "bg-amber-100 text-amber-700 border-amber-200",
  likely: "bg-green-100 text-green-700 border-green-200",
  wildcard: "bg-purple-100 text-purple-700 border-purple-200",
};

export function StudentStrategistPanel({ studentId }: { studentId: string }) {
  const [running, setRunning] = useState(false);
  const [latest, setLatest] = useState<Review | null>(null);
  const [history, setHistory] = useState<Review[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("student_strategy_reviews")
      .select("id, mode, output_json, created_at")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(10);
    const rows = (data || []) as Review[];
    setHistory(rows);
    setLatest(rows[0] || null);
  };

  useEffect(() => {
    load();
  }, [studentId]);

  const runReview = async (mode: "fast" | "deep") => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("student-strategy", {
        body: { studentId, mode },
      });
      if (error || (data as any)?.error) {
        toast.error((data as any)?.error || error?.message || "Failed");
      } else {
        toast.success(`Strategy review (${mode}) ready`);
        await load();
      }
    } finally {
      setRunning(false);
    }
  };

  const out = latest?.output_json || {};

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">AI Application Strategist</h3>
            <p className="text-xs text-muted-foreground">
              Balance check, gap analysis, and suggested additions based on the student's profile and current list.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => runReview("fast")} disabled={running}>
            {running ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
            Fast review
          </Button>
          <Button size="sm" onClick={() => runReview("deep")} disabled={running}>
            Deep review
          </Button>
        </div>
      </div>

      <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900 flex items-start gap-2 mb-4">
        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        AI suggestions are a starting point, not a verdict. Always validate with current admit data.
      </div>

      {!latest && (
        <p className="text-sm text-muted-foreground text-center py-6">
          No review yet. Click "Fast review" to generate one.
        </p>
      )}

      {latest && (
        <div className="space-y-5">
          {out.verdict && (
            <div>
              <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">Verdict</div>
              <p className="text-sm font-medium">{out.verdict}</p>
            </div>
          )}

          {out.buckets && (
            <div className="flex gap-2 flex-wrap">
              {Object.entries(out.buckets).map(([k, v]) => (
                <Badge key={k} variant="outline" className={`${bucketColor[k] || ""} border`}>
                  {k}: {String(v)}
                </Badge>
              ))}
            </div>
          )}

          {Array.isArray(out.colleges) && out.colleges.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                Per-college reasoning
              </div>
              <div className="space-y-2">
                {out.colleges.map((c: any, i: number) => (
                  <div key={i} className="flex gap-3 items-start text-sm border-l-2 pl-3 py-1 border-muted">
                    <Badge variant="outline" className={`${bucketColor[c.bucket] || ""} border shrink-0`}>
                      {c.bucket}
                    </Badge>
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-muted-foreground text-xs">{c.reason}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {Array.isArray(out.gaps) && out.gaps.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">Gaps to address</div>
              <ul className="space-y-1">
                {out.gaps.map((g: string, i: number) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {Array.isArray(out.suggestions) && out.suggestions.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">Suggested additions</div>
              <div className="space-y-2">
                {out.suggestions.map((s: any, i: number) => (
                  <div key={i} className="flex gap-3 items-start text-sm border-l-2 pl-3 py-1 border-primary/40">
                    <Badge variant="outline" className={`${bucketColor[s.bucket] || ""} border shrink-0`}>
                      {s.bucket}
                    </Badge>
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-muted-foreground text-xs">{s.rationale}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
            <span>
              {latest.mode} review · {new Date(latest.created_at).toLocaleString()}
            </span>
            {history.length > 1 && (
              <button
                className="hover:text-foreground flex items-center gap-1"
                onClick={() => setShowHistory((s) => !s)}
              >
                <History className="h-3 w-3" />
                {showHistory ? "Hide" : "History"} ({history.length})
              </button>
            )}
          </div>

          {showHistory && (
            <div className="space-y-1 text-xs">
              {history.map((r) => (
                <button
                  key={r.id}
                  className={`block w-full text-left px-2 py-1 rounded hover:bg-muted ${
                    r.id === latest.id ? "bg-muted font-medium" : ""
                  }`}
                  onClick={() => setLatest(r)}
                >
                  {r.mode} · {new Date(r.created_at).toLocaleString()}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
