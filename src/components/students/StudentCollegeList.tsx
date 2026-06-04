import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Building2,
  Loader2,
  Plus,
  Trash2,
  ExternalLink,
  Save,
} from "lucide-react";
import { format, differenceInCalendarDays, parseISO } from "date-fns";

interface Props {
  studentId: string;
}

type College = {
  id: string;
  student_id: string;
  college_name: string;
  country: string | null;
  list_bucket: string;
  application_plan: string | null;
  deadline: string | null;
  status: string;
  submitted_at: string | null;
  decision_at: string | null;
  portal_url: string | null;
  application_id: string | null;
  scholarship_amount: number | null;
  notes: string | null;
  sort_order: number;
};

const BUCKETS = ["reach", "target", "safety", "likely"] as const;
const PLANS = ["ED", "ED2", "EA", "REA", "RD", "Rolling"] as const;
const STATUSES = [
  "researching",
  "planned",
  "in_progress",
  "submitted",
  "admitted",
  "denied",
  "waitlisted",
  "deferred",
  "withdrawn",
] as const;

const STATUS_COLORS: Record<string, string> = {
  researching: "bg-muted text-muted-foreground",
  planned: "bg-blue-100 text-blue-800",
  in_progress: "bg-amber-100 text-amber-800",
  submitted: "bg-indigo-100 text-indigo-800",
  admitted: "bg-green-100 text-green-800",
  denied: "bg-red-100 text-red-800",
  waitlisted: "bg-yellow-100 text-yellow-800",
  deferred: "bg-orange-100 text-orange-800",
  withdrawn: "bg-muted text-muted-foreground",
};

const BUCKET_COLORS: Record<string, string> = {
  reach: "bg-purple-100 text-purple-800",
  target: "bg-blue-100 text-blue-800",
  safety: "bg-green-100 text-green-800",
  likely: "bg-teal-100 text-teal-800",
};

const formatStatus = (s: string) => s.replace(/_/g, " ");

export function StudentCollegeList({ studentId }: Props) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<College[]>([]);
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  const fetchRows = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("student_colleges")
      .select("*")
      .eq("student_id", studentId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) {
      toast({ title: "Error", description: "Could not load college list", variant: "destructive" });
    } else {
      setRows((data || []) as College[]);
      setDirty({});
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const updateLocal = (id: string, patch: Partial<College>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    setDirty((d) => ({ ...d, [id]: true }));
  };

  const saveRow = async (row: College) => {
    setSavingId(row.id);
    const { error } = await supabase
      .from("student_colleges")
      .update({
        college_name: row.college_name,
        country: row.country,
        list_bucket: row.list_bucket,
        application_plan: row.application_plan,
        deadline: row.deadline,
        status: row.status,
        submitted_at: row.submitted_at,
        decision_at: row.decision_at,
        portal_url: row.portal_url,
        application_id: row.application_id,
        scholarship_amount: row.scholarship_amount,
        notes: row.notes,
      })
      .eq("id", row.id);
    setSavingId(null);
    if (error) {
      toast({ title: "Error", description: "Could not save row", variant: "destructive" });
    } else {
      setDirty((d) => {
        const next = { ...d };
        delete next[row.id];
        return next;
      });
      toast({ title: "Saved" });
    }
  };

  const removeRow = async (id: string) => {
    if (!confirm("Remove this college from the list?")) return;
    const { error } = await supabase.from("student_colleges").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Could not remove", variant: "destructive" });
    } else {
      setRows((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const addRow = async () => {
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    const nextOrder = (rows[rows.length - 1]?.sort_order ?? 0) + 10;
    const { data, error } = await supabase
      .from("student_colleges")
      .insert({
        student_id: studentId,
        college_name: name,
        list_bucket: "target",
        status: "researching",
        sort_order: nextOrder,
      })
      .select()
      .single();
    setAdding(false);
    if (error || !data) {
      toast({ title: "Error", description: "Could not add college", variant: "destructive" });
    } else {
      setRows((prev) => [...prev, data as College]);
      setNewName("");
    }
  };

  // Summary counts
  const counts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.list_bucket] = (acc[r.list_bucket] || 0) + 1;
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            College List ({rows.length})
          </CardTitle>
          <div className="flex flex-wrap gap-1.5">
            {BUCKETS.map((b) => (
              <Badge key={b} variant="outline" className={BUCKET_COLORS[b]}>
                {b}: {counts[b] || 0}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add row */}
        <div className="flex gap-2">
          <Input
            placeholder="Add a college (e.g., Brown University)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addRow();
            }}
          />
          <Button onClick={addRow} disabled={adding || !newName.trim()}>
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            <span className="ms-1 hidden sm:inline">Add</span>
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No colleges yet. Add a school to start tracking applications.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b">
                <tr>
                  <th className="text-left p-2 min-w-40">College</th>
                  <th className="text-left p-2">Bucket</th>
                  <th className="text-left p-2">Plan</th>
                  <th className="text-left p-2">Deadline</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Portal</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const daysLeft = row.deadline
                    ? differenceInCalendarDays(parseISO(row.deadline), new Date())
                    : null;
                  const isDirty = !!dirty[row.id];
                  return (
                    <tr key={row.id} className="border-b align-top hover:bg-muted/30">
                      <td className="p-2">
                        <Input
                          className="h-8"
                          value={row.college_name}
                          onChange={(e) => updateLocal(row.id, { college_name: e.target.value })}
                        />
                        <Input
                          className="h-7 mt-1 text-xs"
                          value={row.country || ""}
                          placeholder="Country"
                          onChange={(e) => updateLocal(row.id, { country: e.target.value })}
                        />
                      </td>
                      <td className="p-2">
                        <Select
                          value={row.list_bucket}
                          onValueChange={(v) => updateLocal(row.id, { list_bucket: v })}
                        >
                          <SelectTrigger className="h-8 w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {BUCKETS.map((b) => (
                              <SelectItem key={b} value={b}>
                                {b}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2">
                        <Select
                          value={row.application_plan || "none"}
                          onValueChange={(v) =>
                            updateLocal(row.id, { application_plan: v === "none" ? null : v })
                          }
                        >
                          <SelectTrigger className="h-8 w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">—</SelectItem>
                            {PLANS.map((p) => (
                              <SelectItem key={p} value={p}>
                                {p}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2">
                        <Input
                          type="date"
                          className="h-8 w-36"
                          value={row.deadline || ""}
                          onChange={(e) =>
                            updateLocal(row.id, { deadline: e.target.value || null })
                          }
                        />
                        {daysLeft !== null && (
                          <p
                            className={`text-xs mt-1 ${
                              daysLeft < 0
                                ? "text-muted-foreground"
                                : daysLeft <= 14
                                ? "text-destructive font-medium"
                                : "text-muted-foreground"
                            }`}
                          >
                            {daysLeft < 0
                              ? `${Math.abs(daysLeft)}d ago`
                              : daysLeft === 0
                              ? "Today"
                              : `in ${daysLeft}d`}
                          </p>
                        )}
                      </td>
                      <td className="p-2">
                        <Select
                          value={row.status}
                          onValueChange={(v) => updateLocal(row.id, { status: v })}
                        >
                          <SelectTrigger className="h-8 w-32">
                            <Badge variant="outline" className={STATUS_COLORS[row.status]}>
                              {formatStatus(row.status)}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {formatStatus(s)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1 items-center">
                          <Input
                            className="h-8 w-36"
                            placeholder="Portal URL"
                            value={row.portal_url || ""}
                            onChange={(e) =>
                              updateLocal(row.id, { portal_url: e.target.value || null })
                            }
                          />
                          {row.portal_url && (
                            <a
                              href={row.portal_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="p-2 text-right whitespace-nowrap">
                        {isDirty && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => saveRow(row)}
                            disabled={savingId === row.id}
                          >
                            {savingId === row.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Save className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => removeRow(row.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
