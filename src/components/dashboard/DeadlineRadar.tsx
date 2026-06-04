import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type DeadlineRow = {
  id: string;
  student_id: string;
  college_name: string;
  application_plan: string | null;
  deadline: string;
  student_name: string;
};

function daysUntil(dateStr: string): number {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyColor(days: number): string {
  if (days <= 7) return "bg-red-100 text-red-700 border-red-200";
  if (days <= 14) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

export function DeadlineRadar() {
  const [rows, setRows] = useState<DeadlineRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const today = new Date();
      const in14 = new Date();
      in14.setDate(today.getDate() + 14);
      const iso = (d: Date) => d.toISOString().slice(0, 10);

      const { data, error } = await supabase
        .from("student_colleges")
        .select("id, student_id, college_name, application_plan, deadline, students(name)")
        .gte("deadline", iso(today))
        .lte("deadline", iso(in14))
        .order("deadline", { ascending: true });

      if (!error && data) {
        setRows(
          (data as any[]).map((r) => ({
            id: r.id,
            student_id: r.student_id,
            college_name: r.college_name,
            application_plan: r.application_plan,
            deadline: r.deadline,
            student_name: r.students?.name || "Unknown",
          })),
        );
      }
      setLoading(false);
    })();
  }, []);

  if (loading || rows.length === 0) return null;

  const uniqueStudents = new Set(rows.map((r) => r.student_id)).size;
  const next = rows[0];

  return (
    <Link to="/deadlines" className="block mb-6 group">
      <Card className="p-4 sm:p-5 border-l-4 border-l-red-500 bg-gradient-to-r from-red-50/60 to-transparent hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="rounded-full bg-red-100 p-2 shrink-0">
              <Clock className="h-5 w-5 text-red-600" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-foreground">
                {rows.length} deadline{rows.length === 1 ? "" : "s"} in the next 14 days
                <span className="text-muted-foreground font-normal">
                  {" "}
                  across {uniqueStudents} student{uniqueStudents === 1 ? "" : "s"}
                </span>
              </div>
              <div className="text-sm text-muted-foreground mt-1 truncate">
                Next up:{" "}
                <span className="font-medium text-foreground">{next.student_name}</span> —{" "}
                {next.college_name}
                {next.application_plan ? ` (${next.application_plan})` : ""}
                <Badge variant="outline" className={`ml-2 ${urgencyColor(daysUntil(next.deadline))}`}>
                  {daysUntil(next.deadline)}d
                </Badge>
              </div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0 mt-1" />
        </div>
      </Card>
    </Link>
  );
}
