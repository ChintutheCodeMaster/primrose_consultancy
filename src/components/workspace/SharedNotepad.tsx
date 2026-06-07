import { useWorkspaceNotes } from '@/hooks/useWorkspaceNotes';
import { Textarea } from '@/components/ui/textarea';
import { StickyNote, Loader2 } from 'lucide-react';

interface Props {
  studentId: string;
  side: 'consultant' | 'student';
  className?: string;
}

function relTime(iso: string | null) {
  if (!iso) return 'never';
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return new Date(iso).toLocaleString();
}

export function SharedNotepad({ studentId, side, className }: Props) {
  const { body, update, loading, savedAt } = useWorkspaceNotes(studentId, side);

  return (
    <div className={`rounded-2xl border bg-gradient-to-br from-amber-50/60 via-white to-white p-4 shadow-sm ${className ?? ''}`}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-amber-600" />
          <h3 className="text-sm font-semibold">Shared notepad</h3>
          <span className="text-[11px] text-muted-foreground">consultant & student edit together</span>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {loading ? <Loader2 className="inline h-3 w-3 animate-spin" /> : `Saved ${relTime(savedAt)}`}
        </span>
      </div>
      <Textarea
        value={body}
        onChange={(e) => update(e.target.value)}
        placeholder="Weekly agenda, decisions, things to ask, ideas in progress…"
        className="min-h-[160px] resize-y border-dashed bg-white/60 font-mono text-sm leading-relaxed focus-visible:ring-amber-400"
        disabled={loading}
      />
    </div>
  );
}
