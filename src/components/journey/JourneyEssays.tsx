import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Loader2, Sparkles } from 'lucide-react';
import { useNogaIdentity } from '@/lib/nogaIdentity';

interface EssayRow {
  id: string;
  essay_title: string;
  essay_content: string;
  status: string;
  target_school: string | null;
  word_limit: number | null;
  updated_at: string;
  sent_at: string | null;
}

const statusVariant = (status: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
  switch (status) {
    case 'pending':
    case 'submitted':
      return 'secondary';
    case 'in_progress':
      return 'outline';
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
      return 'Awaiting feedback';
    case 'in_progress':
      return 'Consultant reviewing';
    case 'sent':
      return 'Feedback ready';
    case 'draft':
      return 'Draft';
    default:
      return status;
  }
};

const wordCount = (text: string): number =>
  text.trim() ? text.trim().split(/\s+/).length : 0;

/**
 * Embedded essay list for the student workspace "Essays" tab.
 * Mirrors StudentEssayList but without the standalone page chrome —
 * fits inside the workspace tab content area.
 */
export function JourneyEssays() {
  const navigate = useNavigate();
  const identity = useNogaIdentity();
  const [essays, setEssays] = useState<EssayRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (identity.loading) return;
    if (!identity.studentId) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('essay_feedback' as any)
        .select('id, essay_title, essay_content, status, target_school, word_limit, updated_at, sent_at')
        .eq('student_id', identity.studentId)
        .order('updated_at', { ascending: false });
      setEssays(((data as any[]) ?? []) as EssayRow[]);
      setLoading(false);
    })();
  }, [identity.loading, identity.studentId]);

  const openEssay = (row: EssayRow) => {
    if (row.status === 'sent') navigate(`/student/essay/${row.id}/edit`);
    else navigate(`/student/essay/${row.id}`);
  };

  if (identity.loading || loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!identity.studentId) {
    return (
      <Card className="rounded-2xl border-white/60 bg-white/80 backdrop-blur">
        <CardContent className="py-12 text-center text-muted-foreground space-y-2">
          <p className="font-medium">Your account isn&apos;t linked yet</p>
          <p className="text-sm">Ask your consultant to link your account to your student profile.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-white/70 via-violet-50/40 to-rose-50/40 backdrop-blur-xl p-6 sm:p-7 shadow-[0_8px_30px_-12px_hsl(263_70%_50%/0.15)] animate-slide-up">
        <div className="absolute -top-16 -right-8 h-40 w-40 rounded-full bg-violet-300/25 blur-3xl animate-float" />
        <div className="absolute -bottom-12 left-16 h-32 w-32 rounded-full bg-rose-300/20 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/70 border border-violet-200/60 px-3 py-1 text-xs font-medium text-violet-700 mb-3 backdrop-blur">
              <Sparkles className="h-3 w-3" /> Essays
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ fontFamily: 'Sora, Inter, sans-serif' }}>
              My essays
            </h2>
            <p className="text-muted-foreground mt-2 text-sm max-w-md">
              Draft an essay, submit it for review, and get feedback from your consultant.
            </p>
          </div>
          <Button
            onClick={() => navigate('/student/essay/new')}
            className="rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-md shadow-violet-500/25 hover:shadow-lg hover:shadow-violet-500/35 transition-all press-soft gap-1.5"
          >
            <Plus className="h-4 w-4" /> New essay
          </Button>
        </div>
      </div>

      {essays.length === 0 ? (
        <Card className="card-lift rounded-2xl border-white/60 bg-white/80 backdrop-blur animate-slide-up stagger-1">
          <CardContent className="py-16 text-center space-y-3">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-rose-100 text-violet-700">
              <FileText className="h-7 w-7" />
            </div>
            <p className="text-muted-foreground">No essays yet.</p>
            <Button
              onClick={() => navigate('/student/essay/new')}
              className="mt-2 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-md shadow-violet-500/25 press-soft gap-1.5"
            >
              <Plus className="h-4 w-4" /> Start your first essay
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {essays.map((essay, i) => (
            <Card
              key={essay.id}
              style={{ animationDelay: `${i * 60}ms` }}
              className="card-lift rounded-2xl border-white/60 bg-white/80 backdrop-blur cursor-pointer animate-slide-up-sm"
              onClick={() => openEssay(essay)}
            >
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <h3 className="font-semibold truncate">{essay.essay_title || 'Untitled essay'}</h3>
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
                    <span>•</span>
                    <span>Updated {new Date(essay.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
