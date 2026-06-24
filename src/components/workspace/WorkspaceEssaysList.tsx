import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Loader2, ExternalLink, Sparkles } from 'lucide-react';
import { EssayFeedbackModal, type Essay } from '@/components/EssayFeedbackModal';

interface EssayRow {
  id: string;
  student_id: string;
  essay_title: string;
  essay_content: string;
  essay_prompt: string | null;
  target_school: string | null;
  word_limit: number | null;
  status: string;
  updated_at: string;
  sent_at: string | null;
  created_at: string;
}

const statusVariant = (status: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
  switch (status) {
    case 'pending':
    case 'submitted':
      return 'destructive';
    case 'in_progress':
      return 'secondary';
    case 'sent':
      return 'default';
    default:
      return 'outline';
  }
};

const statusLabel = (status: string): string => {
  switch (status) {
    case 'pending':
    case 'submitted':
      return 'Awaiting review';
    case 'in_progress':
      return 'In review';
    case 'sent':
      return 'Sent to student';
    case 'draft':
      return 'Draft';
    default:
      return status;
  }
};

const wordCount = (text: string): number =>
  text.trim() ? text.trim().split(/\s+/).length : 0;

export function WorkspaceEssaysList({ studentId }: { studentId: string }) {
  const [student, setStudent] = useState<{ id: string; name: string; email: string | null } | null>(null);
  const [essays, setEssays] = useState<EssayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<EssayRow | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: studentRow }, { data: essayRows }] = await Promise.all([
      supabase
        .from('students')
        .select('id, name, email')
        .eq('id', studentId)
        .maybeSingle(),
      supabase
        .from('essay_feedback' as any)
        .select('*')
        .eq('student_id', studentId)
        .order('updated_at', { ascending: false }),
    ]);
    setStudent((studentRow as any) ?? null);
    setEssays(((essayRows as any[]) ?? []) as EssayRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const modalEssay: Essay | null = selected && student
    ? {
        id: selected.id,
        title: selected.essay_title,
        studentName: student.name,
        studentId: student.id,
        studentEmail: student.email,
        prompt: selected.essay_prompt ?? '',
        content: selected.essay_content,
      }
    : null;

  return (
    <div className="rounded-2xl border bg-card p-5 sm:p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">Essays</h3>
            <p className="text-xs text-muted-foreground">
              Student-submitted essays with versioned feedback.
            </p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to={`/students/${studentId}/essays`}>
            Full-page view <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : essays.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-center">
          <Sparkles className="mx-auto mb-2 h-5 w-5 text-violet-600" />
          <p className="text-sm text-muted-foreground">
            No essays yet. The student can start one from their dashboard — it will show up here for review the moment they submit.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {essays.map((essay) => (
            <Card
              key={essay.id}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => setSelected(essay)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <h4 className="font-semibold truncate">{essay.essay_title}</h4>
                  <Badge variant={statusVariant(essay.status)} className="shrink-0">
                    {statusLabel(essay.status)}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>{wordCount(essay.essay_content)} words</span>
                  {essay.target_school && (
                    <>
                      <span>•</span>
                      <span>{essay.target_school}</span>
                    </>
                  )}
                  {essay.word_limit && (
                    <>
                      <span>•</span>
                      <span>limit {essay.word_limit}</span>
                    </>
                  )}
                  <span>•</span>
                  <span>
                    {essay.sent_at
                      ? `Sent ${new Date(essay.sent_at).toLocaleDateString()}`
                      : `Updated ${new Date(essay.updated_at).toLocaleDateString()}`}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {modalEssay && (
        <EssayFeedbackModal
          isOpen={!!modalEssay}
          onClose={() => {
            setSelected(null);
            load();
          }}
          essay={modalEssay}
        />
      )}
    </div>
  );
}
