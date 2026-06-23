import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
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
    case 'draft':
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

export default function ConsultantEssayReview() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<{ id: string; name: string; email: string | null } | null>(null);
  const [essays, setEssays] = useState<EssayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEssay, setSelectedEssay] = useState<EssayRow | null>(null);

  const loadEssays = async () => {
    if (!id) return;
    setLoading(true);
    const [{ data: studentRow }, { data: essayRows }] = await Promise.all([
      supabase
        .from('students')
        .select('id, name, email')
        .eq('id', id)
        .maybeSingle(),
      supabase
        .from('essay_feedback' as any)
        .select('*')
        .eq('student_id', id)
        .order('updated_at', { ascending: false }),
    ]);
    setStudent((studentRow as any) ?? null);
    setEssays(((essayRows as any[]) ?? []) as EssayRow[]);
    setLoading(false);
  };

  useEffect(() => {
    loadEssays();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const openEssay = (row: EssayRow) => setSelectedEssay(row);
  const closeEssay = () => {
    setSelectedEssay(null);
    loadEssays();
  };

  const modalEssay: Essay | null = selectedEssay && student
    ? {
        id: selectedEssay.id,
        title: selectedEssay.essay_title,
        studentName: student.name,
        studentId: student.id,
        studentEmail: student.email,
        prompt: selectedEssay.essay_prompt ?? '',
        content: selectedEssay.essay_content,
      }
    : null;

  return (
    <MainLayout>
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to={`/students/${id}/workspace`}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to workspace
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">
              Essays{student ? ` — ${student.name}` : ''}
            </h1>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : essays.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground space-y-3">
              <FileText className="h-10 w-10 mx-auto opacity-40" />
              <p>No essays yet.</p>
              <p className="text-sm">
                The student can start one from their dashboard. When they submit,
                it will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {essays.map((essay) => (
              <Card
                key={essay.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => openEssay(essay)}
              >
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <h3 className="font-semibold truncate">{essay.essay_title}</h3>
                      <Badge variant={statusVariant(essay.status)} className="shrink-0">
                        {statusLabel(essay.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
                  </div>
                  <Plus className="h-4 w-4 text-muted-foreground shrink-0 rotate-45" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {modalEssay && (
        <EssayFeedbackModal
          isOpen={!!modalEssay}
          onClose={closeEssay}
          essay={modalEssay}
        />
      )}
    </MainLayout>
  );
}
