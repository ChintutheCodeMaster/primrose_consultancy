import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Plus, Loader2 } from 'lucide-react';
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

export default function StudentEssayList() {
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
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!identity.studentId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold">Your account isn&apos;t linked yet</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Ask your consultant to link your account to your student profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b sticky top-0 z-10 bg-background">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to="/student">
                <ArrowLeft className="h-4 w-4 mr-1" /> Home
              </Link>
            </Button>
            <h1 className="text-lg font-semibold">My Essays</h1>
          </div>
          <Button size="sm" onClick={() => navigate('/student/essay/new')}>
            <Plus className="h-4 w-4 mr-1" /> New Essay
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {essays.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground space-y-3">
              <FileText className="h-10 w-10 mx-auto opacity-40" />
              <p>No essays yet.</p>
              <Button onClick={() => navigate('/student/essay/new')} className="mt-2">
                <Plus className="h-4 w-4 mr-1" /> Start your first essay
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
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
    </div>
  );
}
