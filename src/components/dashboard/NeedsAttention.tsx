import { Link } from 'react-router-dom';
import { AlertTriangle, ChevronRight, FileWarning, Clock, UserX, CircleDollarSign } from 'lucide-react';
import type { PracticeHealth } from '@/hooks/usePracticeHealth';

interface Props { data?: PracticeHealth }

export function NeedsAttention({ data }: Props) {
  if (!data) {
    return <div className="h-64 animate-pulse rounded-3xl bg-muted" />;
  }

  const items = [
    { label: 'Cold leads', value: data.coldLeads, icon: UserX, tone: 'text-rose-600 bg-rose-50', to: '/leads/all' },
    { label: 'Unsigned agreements', value: data.unsignedAgreements, icon: FileWarning, tone: 'text-violet-600 bg-violet-50', to: '/students' },
    { label: 'Deadlines next 14 days', value: data.upcomingDeadlines, icon: Clock, tone: 'text-amber-600 bg-amber-50', to: '/deadlines' },
    { label: 'Unpaid students', value: data.unpaidStudents, icon: CircleDollarSign, tone: 'text-emerald-700 bg-emerald-50', to: '/students' },
  ];

  return (
    <div className="rounded-3xl border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Needs Attention</h3>
          <p className="text-xs text-muted-foreground">Things only you can resolve</p>
        </div>
      </div>

      <ul className="space-y-2">
        {items.map((it) => (
          <li key={it.label}>
            <Link
              to={it.to}
              className="flex items-center justify-between rounded-2xl border bg-background px-4 py-3 transition-all hover:border-foreground/20 hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${it.tone}`}>
                  <it.icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">{it.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold tabular-nums">{it.value}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
