import { Users, DollarSign, Wallet, Trophy, FileCheck, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PracticeHealth } from '@/hooks/usePracticeHealth';

function usd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${Math.round(n).toLocaleString()}`;
}

interface CardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  hint?: string;
  tone?: 'emerald' | 'indigo' | 'amber' | 'rose' | 'sky' | 'violet';
}

const TONES: Record<NonNullable<CardProps['tone']>, string> = {
  emerald: 'from-emerald-500/10 to-emerald-500/0 text-emerald-700',
  indigo: 'from-indigo-500/10 to-indigo-500/0 text-indigo-700',
  amber: 'from-amber-500/10 to-amber-500/0 text-amber-700',
  rose: 'from-rose-500/10 to-rose-500/0 text-rose-700',
  sky: 'from-sky-500/10 to-sky-500/0 text-sky-700',
  violet: 'from-violet-500/10 to-violet-500/0 text-violet-700',
};

function HealthCard({ label, value, icon: Icon, hint, tone = 'indigo' }: CardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-60', TONES[tone])} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 backdrop-blur', TONES[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export function PracticeHealthCards({ data }: { data?: PracticeHealth }) {
  if (!data) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      <HealthCard label="Active Students" value={String(data.activeStudents)} icon={Users} tone="indigo" hint={`+${data.newStudentsMonth} this month`} />
      <HealthCard label="Acceptances YTD" value={String(data.acceptancesYTD)} icon={Trophy} tone="amber" hint="celebrate every one" />
      <HealthCard label="Pipeline" value={usd(data.pipelineValue)} icon={DollarSign} tone="emerald" hint="committed, not yet paid" />
      <HealthCard label="Collected MTD" value={usd(data.collectedMTD)} icon={Wallet} tone="sky" hint="this month" />
      <HealthCard label="Unsigned Agreements" value={String(data.unsignedAgreements)} icon={FileCheck} tone="violet" hint="needs your signature" />
      <HealthCard label="Cold Leads" value={String(data.coldLeads)} icon={AlertCircle} tone="rose" hint=">10 days quiet" />
    </div>
  );
}
