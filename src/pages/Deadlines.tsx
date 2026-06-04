import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

export default function Deadlines() {
  const [rows, setRows] = useState<DeadlineRow[]>([]);
  const [loading, setLoading] = useState(true);

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

  // group by bucket
  const groups: Record<string, DeadlineRow[]> = {};
  for (const r of rows) {
    const k = bucketLabel(daysUntil(r.deadline));
    (groups[k] ||= []).push(r);
  }
  const order = ["Overdue", "Next 7 days", "8–14 days", "15–30 days", "31+ days"];

  return (
    <MainLayout>
      <div className="animate-fade-in max-w-5xl">
        <Link to="/app" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-3">
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
          <div className="space-y-6">
            {order.map((bucket) => {
              const list = groups[bucket];
              if (!list?.length) return null;
              return (
                <div key={bucket}>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    {bucket} <span className="text-foreground/60">({list.length})</span>
                  </h2>
                  <div className="space-y-2">
                    {list.map((r) => {
                      const d = daysUntil(r.deadline);
                      const u = urgency(d);
                      return (
                        <Card key={r.id} className="p-4 hover:shadow-sm transition-shadow">
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="min-w-0 flex-1">
                              <div className="font-medium truncate">
                                {r.student_name} —{" "}
                                <span className="text-foreground/80">{r.college_name}</span>
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
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
