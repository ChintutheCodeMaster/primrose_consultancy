import { useWorkspacePresence } from '@/hooks/useWorkspacePresence';
import { cn } from '@/lib/utils';

export function WorkspacePresence({
  studentId,
  side,
  className,
}: {
  studentId: string;
  side: 'consultant' | 'student';
  className?: string;
}) {
  const { otherOnline } = useWorkspacePresence(studentId, side);
  const otherLabel = side === 'consultant' ? 'Student' : 'Consultant';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        otherOnline
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-muted bg-muted/40 text-muted-foreground',
        className
      )}
    >
      <span
        className={cn(
          'inline-block h-1.5 w-1.5 rounded-full',
          otherOnline ? 'animate-pulse bg-emerald-500' : 'bg-muted-foreground/50'
        )}
      />
      {otherOnline ? `${otherLabel} viewing now` : `${otherLabel} offline`}
    </div>
  );
}
