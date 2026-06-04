import { useEffect, useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Award, Download, Link2, Loader2, Trophy } from "lucide-react";
import { toast } from "sonner";

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-outcomes-pdf`;

function makeToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(20)))
    .map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function Outcomes() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const [years, setYears] = useState<number[]>([currentYear]);
  const [stats, setStats] = useState({ placed: 0, scholarships: 0, schools: 0 });
  const [brandName, setBrandName] = useState("Primrose IEC");
  const [brandColor, setBrandColor] = useState("#0f172a");
  const [highlights, setHighlights] = useState("");
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("students").select("graduation_year").not("graduation_year", "is", null);
      const ys = Array.from(new Set((data || []).map((r: any) => Number(r.graduation_year)))).filter((y): y is number => Number.isFinite(y)).sort((a, b) => b - a);
      if (ys.length) {
        setYears(ys);
        setYear(ys[0]);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const { data: students } = await supabase
        .from("students")
        .select("id, accepted_universities(university_name)")
        .eq("graduation_year", String(year));
      const { data: scholarships } = await supabase
        .from("student_scholarships")
        .select("amount, students!inner(graduation_year)")
        .eq("students.graduation_year", String(year));

      const schools = new Set<string>();
      for (const s of (students || []) as any[]) {
        for (const u of s.accepted_universities || []) schools.add(u.university_name);
      }
      setStats({
        placed: (students || []).length,
        scholarships: (scholarships || []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0),
        schools: schools.size,
      });

      const { data: tok } = await supabase
        .from("outcomes_share_tokens")
        .select("token")
        .eq("cohort_year", year)
        .eq("status", "active")
        .maybeSingle();
      setShareToken(tok?.token || null);
    })();
  }, [year]);

  const config = useMemo(
    () => ({
      brandName,
      brandColor,
      highlights: highlights.split("\n").map((s) => s.trim()).filter(Boolean),
    }),
    [brandName, brandColor, highlights],
  );

  const previewUrl = useMemo(() => {
    const params = new URLSearchParams({ year: String(year) });
    return `${FN_URL}?${params.toString()}`;
  }, [year]);

  const openOnePager = async () => {
    setLoading(true);
    try {
      const res = await fetch(FN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, config }),
      });
      const html = await res.text();
      const blob = new Blob([html], { type: "text/html" });
      window.open(URL.createObjectURL(blob), "_blank");
    } finally {
      setLoading(false);
    }
  };

  const createShareLink = async () => {
    const token = makeToken();
    const shareUrl = `${window.location.origin}/outcomes/share/${token}`;
    const { error } = await supabase.from("outcomes_share_tokens").insert({
      token,
      cohort_year: year,
      config: { ...config, shareUrl },
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setShareToken(token);
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Share link copied to clipboard");
  };

  const copyExistingLink = async () => {
    if (!shareToken) return;
    const url = `${window.location.origin}/outcomes/share/${shareToken}`;
    await navigator.clipboard.writeText(url);
    toast.success("Share link copied");
  };

  const revokeLink = async () => {
    if (!shareToken) return;
    await supabase.from("outcomes_share_tokens").update({ status: "revoked" }).eq("token", shareToken);
    setShareToken(null);
    toast.success("Link revoked");
  };

  return (
    <MainLayout>
      <div className="animate-fade-in max-w-6xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-full bg-primary/10 p-2">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Outcomes Report</h1>
            <p className="text-muted-foreground text-sm mt-1">
              One-pager you can print, save as PDF, or share publicly to win next year's families.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-5 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" /> Cohort & branding
            </h2>

            <div className="space-y-2">
              <Label>Graduation year</Label>
              <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>Class of {y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-3 py-2 border-y">
              <Stat label="Students" value={stats.placed} />
              <Stat label="Scholarships" value={`$${stats.scholarships.toLocaleString()}`} />
              <Stat label="Schools" value={stats.schools} />
            </div>

            <div className="space-y-2">
              <Label>Brand name on the report</Label>
              <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Brand color</Label>
              <div className="flex gap-2">
                <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="h-10 w-14 rounded border" />
                <Input value={brandColor} onChange={(e) => setBrandColor(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Highlights (one per line)</Label>
              <Textarea
                rows={4}
                value={highlights}
                onChange={(e) => setHighlights(e.target.value)}
                placeholder="4 Ivy League acceptances&#10;Full-ride to Vanderbilt&#10;Rhodes finalist"
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={openOnePager} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                Open one-pager
              </Button>
              {shareToken ? (
                <>
                  <Button variant="outline" onClick={copyExistingLink}>
                    <Link2 className="h-4 w-4 mr-2" /> Copy share link
                  </Button>
                  <Button variant="ghost" onClick={revokeLink}>Revoke</Button>
                </>
              ) : (
                <Button variant="outline" onClick={createShareLink}>
                  <Link2 className="h-4 w-4 mr-2" /> Create share link
                </Button>
              )}
            </div>
          </Card>

          <Card className="p-2 overflow-hidden bg-slate-50">
            <iframe
              key={previewUrl + brandColor + brandName + highlights}
              title="Outcomes preview"
              src={previewUrl}
              className="w-full h-[800px] rounded border bg-white"
            />
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <div className="text-xl font-bold text-primary">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
