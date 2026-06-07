import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { ActivityFeed } from '@/components/workspace/ActivityFeed';
import { SharedNotepad } from '@/components/workspace/SharedNotepad';
import { WorkspacePresence } from '@/components/workspace/WorkspacePresence';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';

export default function StudentWorkspace() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<any>(null);
  const [journeyToken, setJourneyToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [{ data: s }, { data: t }] = await Promise.all([
        supabase.from('students').select('id, name, last_name').eq('id', id).maybeSingle(),
        supabase.from('student_portal_tokens').select('token').eq('student_id', id).limit(1).maybeSingle(),
      ]);
      setStudent(s);
      setJourneyToken(t?.token ?? null);
      setLoading(false);
    })();
  }, [id]);

  if (!id) return null;

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl space-y-6 pb-12 animate-fade-in">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
              <Link to="/students"><ArrowLeft className="mr-1 h-4 w-4" /> Back to Students</Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">
              Shared workspace
              {student && <span className="ml-2 text-muted-foreground font-normal">· {student.name} {student.last_name ?? ''}</span>}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              One live surface — what happens here, you both see in real time.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <WorkspacePresence studentId={id} side="consultant" />
            {journeyToken && (
              <Button asChild variant="outline" size="sm">
                <Link to={`/journey/${journeyToken}`} target="_blank" rel="noreferrer">
                  Open student view <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading workspace…
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <ActivityFeed studentId={id} viewerSide="consultant" />
            <div className="space-y-6">
              <SharedNotepad studentId={id} side="consultant" />
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
