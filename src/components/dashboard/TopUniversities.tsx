import { GraduationCap } from 'lucide-react';
import type { PracticeHealth } from '@/hooks/usePracticeHealth';

export function TopUniversities({ data }: { data?: PracticeHealth }) {
  const list = data?.topUniversities ?? [];
  const max = Math.max(1, ...list.map((u) => u.count));

  return (
    <div className="rounded-3xl border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Top Universities</h3>
          <p className="text-xs text-muted-foreground">Where your students land most</p>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No acceptance data yet.</p>
      ) : (
        <ul className="space-y-3">
          {list.map((u, i) => (
            <li key={u.name}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium truncate pr-2">
                  <span className="text-muted-foreground mr-2 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                  {u.name}
                </span>
                <span className="font-semibold tabular-nums">{u.count}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                  style={{ width: `${(u.count / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
