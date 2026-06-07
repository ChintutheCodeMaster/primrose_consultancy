import { useAcceptanceWall, tileGradient } from '@/hooks/useAcceptanceWall';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

function shortUni(name: string): string {
  return name
    .replace(/^University of /, 'U. ')
    .replace(/ University$/, '')
    .replace(/^The /, '');
}

export function AcceptanceWall() {
  const { data, isLoading } = useAcceptanceWall();

  return (
    <div className="rounded-3xl border bg-card p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Acceptance Wall</h3>
            <p className="text-xs text-muted-foreground">Every win your students have earned</p>
          </div>
        </div>
        {data && data.length > 0 && (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            {data.length} acceptances
          </span>
        )}
      </div>

      {isLoading && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      )}

      {!isLoading && (!data || data.length === 0) && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-12 text-center">
          <Trophy className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium">No acceptances yet — the wall is waiting.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Mark a student as accepted and watch this fill up.
          </p>
        </div>
      )}

      {!isLoading && data && data.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
          {data.map((tile, i) => (
            <div
              key={tile.id}
              className={cn(
                'group relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br p-2 text-white shadow-sm transition-all duration-300',
                'hover:scale-105 hover:shadow-xl',
                'animate-scale-in',
                tileGradient(tile.colorIndex),
              )}
              style={{ animationDelay: `${Math.min(i, 30) * 25}ms`, animationFillMode: 'both' }}
              title={`${tile.studentName} → ${tile.university}`}
            >
              <div className="flex h-full flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                  {tile.initials}
                </span>
                <span className="text-[10px] font-semibold leading-tight line-clamp-3">
                  {shortUni(tile.university)}
                </span>
              </div>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
