import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, DollarSign, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type Category = { label: string; amount: number; note?: string };
type Result = {
  currency?: string;
  monthly_total?: number;
  annual_total?: number;
  months?: number;
  categories?: Category[];
  assumptions?: string;
  confidence?: 'low' | 'medium' | 'high';
  error?: string;
};

const LIFESTYLES = [
  { value: 'frugal', label: 'Frugal — shared room, cook at home' },
  { value: 'moderate', label: 'Moderate — own room, occasional dining out' },
  { value: 'comfortable', label: 'Comfortable — studio, regular dining & travel' },
];

export function TuitionCalculator() {
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [university, setUniversity] = useState('');
  const [lifestyle, setLifestyle] = useState('moderate');
  const [months, setMonths] = useState('9');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const submit = async () => {
    if (!city.trim()) {
      toast({ title: 'Add a city', description: 'City is required to estimate costs.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('tuition-living-cost', {
        body: { city, country, university, lifestyle, months: Number(months) || 9 },
      });
      if (error) throw error;
      if (data?.error) {
        toast({ title: 'AI error', description: data.error, variant: 'destructive' });
        return;
      }
      setResult(data);
    } catch (e: any) {
      toast({ title: 'Could not estimate', description: e?.message || 'Try again', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-card p-5 sm:p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
          <DollarSign className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold">Living cost calculator</h3>
          <p className="text-xs text-muted-foreground">AI-estimated monthly budget for a student in any city.</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="tc-city">City *</Label>
          <Input id="tc-city" placeholder="e.g. Boston" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="tc-country">Country</Label>
          <Input id="tc-country" placeholder="e.g. United States" value={country} onChange={(e) => setCountry(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="tc-uni">University (optional)</Label>
          <Input id="tc-uni" placeholder="e.g. Boston University" value={university} onChange={(e) => setUniversity(e.target.value)} />
        </div>
        <div>
          <Label>Lifestyle</Label>
          <Select value={lifestyle} onValueChange={setLifestyle}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-72 overflow-y-auto">
              {LIFESTYLES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="tc-months">Months to budget</Label>
          <Input id="tc-months" type="number" min={1} max={36} value={months} onChange={(e) => setMonths(e.target.value)} />
        </div>
      </div>

      <Button onClick={submit} disabled={loading} className="mt-4 w-full gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {loading ? 'Estimating…' : 'Estimate living cost'}
      </Button>

      {result && !result.error && (
        <div className="mt-5 space-y-3 animate-fade-in">
          <div className="flex items-baseline justify-between rounded-xl bg-gradient-to-br from-emerald-50 to-sky-50 p-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Monthly</p>
              <p className="text-3xl font-bold tracking-tight">
                ${result.monthly_total?.toLocaleString() ?? '—'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{result.months}-month total</p>
              <p className="text-lg font-semibold">${result.annual_total?.toLocaleString() ?? '—'}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            {result.categories?.map((c) => {
              const pct = result.monthly_total ? Math.round((c.amount / result.monthly_total) * 100) : 0;
              return (
                <div key={c.label} className="rounded-lg border bg-card p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{c.label}</span>
                    <span className="text-sm font-semibold">${c.amount.toLocaleString()}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-muted">
                    <div className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-sky-500" style={{ width: `${pct}%` }} />
                  </div>
                  {c.note && <p className="mt-1 text-xs text-muted-foreground">{c.note}</p>}
                </div>
              );
            })}
          </div>

          {result.assumptions && (
            <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              <strong className="text-foreground">Assumptions:</strong> {result.assumptions}
              {result.confidence && <span className="ml-2 rounded-full bg-background px-2 py-0.5 uppercase tracking-wider">{result.confidence} confidence</span>}
            </p>
          )}
          <p className="text-[11px] text-muted-foreground">Tuition not included. Estimates are guidance only.</p>
        </div>
      )}
    </div>
  );
}
