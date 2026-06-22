import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Clock, ChevronLeft, ExternalLink } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type DeadlineRow = {
  id: string;
  student_id: string;
  college_name: string;
  application_plan: string | null;
  deadline: string;
  portal_url: string | null;
  status: string;
  student_name: string;
};

function daysUntil(dateStr: string): number {
  const d = new Date(dateStr + "T00:00:00");
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - t.getTime()) / 86400000);
}

function urgency(days: number) {
  if (days < 0) return { label: "Overdue", cls: "bg-red-600 text-white" };
  if (days <= 7) return { label: `${days}d`, cls: "bg-red-100 text-red-700 border-red-200" };
  if (days <= 14) return { label: `${days}d`, cls: "bg-amber-100 text-amber-700 border-amber-200" };
  if (days <= 30) return { label: `${days}d`, cls: "bg-yellow-50 text-yellow-700 border-yellow-200" };
  return { label: `${days}d`, cls: "bg-slate-100 text-slate-700 border-slate-200" };
}

function bucketLabel(days: number): string {
  if (days < 0) return "Overdue";
  if (days <= 7) return "Next 7 days";
  if (days <= 14) return "8–14 days";
  if (days <= 30) return "15–30 days";
  return "31+ days";
}

function DeadlineCard({ r }: { r: DeadlineRow }) {
  const d = daysUntil(r.deadline);
  const u = urgency(d);
  return (
    <Card className="p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="font-medium truncate">
            {r.student_name} — <span className="text-foreground/80">{r.college_name}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
            <span>{new Date(r.deadline + "T00:00:00").toLocaleDateString()}</span>
            {r.application_plan && (
              <Badge variant="outline" className="text-[10px] py-0">
                {r.application_plan}
              </Badge>
            )}
            <span className="opacity-60">·</span>
            <span className="capitalize">{r.status?.replace(/_/g, " ")}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={u.cls + " border"}>{u.label}</Badge>
          {r.portal_url && (
            <a href={r.portal_url} target="_blank" rel="noreferrer">
              <Button size="sm" variant="ghost">
                Portal <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </a>
          )}
          <Link to={`/student-portal/${r.student_id}`}>
            <Button size="sm" variant="outline">
              Open student
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

function BucketGroup({ title, list }: { title: string; list: DeadlineRow[] }) {
  if (!list.length) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        {title} <span className="text-foreground/60">({list.length})</span>
      </h3>
      <div className="space-y-2">
        {list.map((r) => <DeadlineCard key={r.id} r={r} />)}
      </div>
    </div>
  );
}

export default function Deadlines() {
  const [rows, setRows] = useState<DeadlineRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const upcomingRef = useRef<HTMLDivElement | null>(null);
  const [highlightUpcoming, setHighlightUpcoming] = useState(false);

  useEffect(() => {
    (async () => {
      const today = new Date();
      const in90 = new Date();
      in90.setDate(today.getDate() + 90);
      const past14 = new Date();
      past14.setDate(today.getDate() - 14);
      const iso = (d: Date) => d.toISOString().slice(0, 10);

      const { data } = await supabase
        .from("student_colleges")
        .select("id, student_id, college_name, application_plan, deadline, portal_url, status, students(name)")
        .gte("deadline", iso(past14))
        .lte("deadline", iso(in90))
        .order("deadline", { ascending: true });

      setRows(
        ((data || []) as any[]).map((r) => ({
          id: r.id,
          student_id: r.student_id,
          college_name: r.college_name,
          application_plan: r.application_plan,
          deadline: r.deadline,
          portal_url: r.portal_url,
          status: r.status,
          student_name: r.students?.name || "Unknown",
        })),
      );
      setLoading(false);
    })();
  }, []);

  // Scroll-to + ring-highlight when arriving via `?focus=upcoming`
  useEffect(() => {
    if (loading) return;
    if (searchParams.get("focus") !== "upcoming") return;
    setHighlightUpcoming(true);
    const t1 = setTimeout(() => {
      upcomingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
    const t2 = setTimeout(() => setHighlightUpcoming(false), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [loading, searchParams]);

  // Bucket rows
  const buckets: Record<string, DeadlineRow[]> = {};
  for (const r of rows) {
    const k = bucketLabel(daysUntil(r.deadline));
    (buckets[k] ||= []).push(r);
  }
  const upcoming = [
    ...(buckets["Overdue"] || []),
    ...(buckets["Next 7 days"] || []),
    ...(buckets["8–14 days"] || []),
  ];

  return (
    <MainLayout>
      <div className="animate-fade-in max-w-5xl">
        <Link to="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-3">
          <ChevronLeft className="h-4 w-4" /> Dashboard
        </Link>
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-full bg-red-100 p-2">
            <Clock className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Deadline Radar</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Application deadlines from 14 days ago through 90 days ahead.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-muted-foreground">Loading…</div>
        ) : rows.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            No upcoming application deadlines. Add deadlines on each student's college list.
          </Card>
        ) : (
          <div className="space-y-10">
            {/* Section 1: Upcoming (next 14 days) */}
            <section
              ref={upcomingRef}
              className={`rounded-2xl border p-5 transition-all duration-500 ${
                highlightUpcoming
                  ? "border-amber-400 ring-4 ring-amber-200/70 shadow-lg bg-amber-50/40"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold">Upcoming — next 14 days</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Overdue and anything due in the next two weeks.
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {upcoming.length}
                </Badge>
              </div>
              {upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing in the next 14 days. Nice.</p>
              ) : (
                <div className="space-y-6">
                  <BucketGroup title="Overdue" list={buckets["Overdue"] || []} />
                  <BucketGroup title="Next 7 days" list={buckets["Next 7 days"] || []} />
                  <BucketGroup title="8–14 days" list={buckets["8–14 days"] || []} />
                </div>
              )}
            </section>

            {/* Section 2: All deadlines */}
            <section className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold">All deadlines</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Every tracked deadline grouped by urgency.
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {rows.length}
                </Badge>
              </div>
              <div className="space-y-6">
                {(["Overdue", "Next 7 days", "8–14 days", "15–30 days", "31+ days"] as const).map((b) => (
                  <BucketGroup key={b} title={b} list={buckets[b] || []} />
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
