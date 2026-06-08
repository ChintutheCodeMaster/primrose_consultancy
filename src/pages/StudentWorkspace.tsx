import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { ActivityFeed } from '@/components/workspace/ActivityFeed';
import { SharedNotepad } from '@/components/workspace/SharedNotepad';
import { WorkspacePresence } from '@/components/workspace/WorkspacePresence';
import { MissionControl } from '@/components/workspace/MissionControl';
import { DraftExchange } from '@/components/workspace/DraftExchange';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink, Loader2, Sparkles } from 'lucide-react';

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
  const studentName = student ? `${student.name} ${student.last_name ?? ''}`.trim() : '';

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl space-y-6 pb-12 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
              <Link to="/students"><ArrowLeft className="mr-1 h-4 w-4" /> Back to Students</Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">
              Workspace
              {studentName && <span className="ml-2 text-muted-foreground font-normal">· {studentName}</span>}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              One shared surface for essays, drafts, AI tools, and the day-to-day.
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
          <>
            <MissionControl studentId={id} studentName={studentName} />

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="essays">Essays & Drafts</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4">
                <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                  <ActivityFeed studentId={id} viewerSide="consultant" />
                  <div className="space-y-6">
                    <SharedNotepad studentId={id} side="consultant" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="essays" className="mt-4">
                <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                  <DraftExchange studentId={id} side="consultant" />
                  <div className="space-y-4">
                    <div className="rounded-2xl border bg-gradient-to-br from-violet-50 to-rose-50 p-5">
                      <div className="mb-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-violet-600" />
                        <h4 className="font-semibold">In-app essay editor</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Open the versioned editor with inline AI line-edit feedback and anchored comments.
                      </p>
                      <Button asChild className="mt-3 w-full">
                        <Link to={`/students/${id}/essays`}>
                          Open essay editor <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="notes" className="mt-4">
                <div className="max-w-3xl">
                  <SharedNotepad studentId={id} side="consultant" />
                </div>
              </TabsContent>
            </Tabs>

          </>
        )}
      </div>
    </MainLayout>
  );
}
