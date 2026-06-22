import { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { MainLayout } from '@/components/layout/MainLayout';
import { ActivityFeed } from '@/components/workspace/ActivityFeed';
import { SharedNotepad } from '@/components/workspace/SharedNotepad';
import { WorkspacePresence } from '@/components/workspace/WorkspacePresence';
import { MissionControl } from '@/components/workspace/MissionControl';
import { DraftExchange } from '@/components/workspace/DraftExchange';
import { JourneyHome } from '@/components/journey/JourneyHome';
import { JourneyColleges } from '@/components/journey/JourneyColleges';
import { JourneyTasks } from '@/components/journey/JourneyTasks';
import { JourneyCalendar } from '@/components/journey/JourneyCalendar';
import { JourneyFiles } from '@/components/journey/JourneyFiles';
import { JourneyDocuments } from '@/components/journey/JourneyDocuments';
import { JourneyWritingLab } from '@/components/journey/JourneyWritingLab';
import { JourneyDetector } from '@/components/journey/JourneyDetector';
import { JourneyMessages } from '@/components/journey/JourneyMessages';
import { JourneyProfile } from '@/components/journey/JourneyProfile';
import { JourneyOnboarding } from '@/components/journey/JourneyOnboarding';
import { CalendarReminderWatcher } from '@/components/journey/CalendarReminderWatcher';
import { TuitionCalculator } from '@/components/workspace/TuitionCalculator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getProgramTerms } from '@/lib/programTerms';
import { ArrowLeft, ExternalLink, Loader2, Sparkles, Home, GraduationCap, ListChecks, CalendarDays, FolderArchive, FileText, FlaskConical, ShieldCheck, DollarSign, MessageSquare, User } from 'lucide-react';

type StudentSection =
  | 'home' | 'colleges' | 'tasks' | 'calendar' | 'files'
  | 'documents' | 'lab' | 'detector' | 'calculator' | 'messages' | 'profile';

const buildStudentNav = (collegesLabel: string): { id: StudentSection; label: string; icon: any }[] => [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'colleges', label: collegesLabel, icon: GraduationCap },
  { id: 'tasks', label: 'Tasks', icon: ListChecks },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'files', label: 'Files', icon: FolderArchive },
  { id: 'documents', label: 'Essays', icon: FileText },
  { id: 'lab', label: 'Writing Lab', icon: FlaskConical },
  { id: 'detector', label: 'AI Detector', icon: ShieldCheck },
  { id: 'calculator', label: 'Living Cost', icon: DollarSign },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'profile', label: 'Profile', icon: User },
];

/**
 * Renders the student-facing tabbed journey UI. Used both inline for the
 * authenticated student (their own workspace) and inside the consultant
 * "Student view" tab so the consultant can preview the same surface.
 */
function StudentJourneyView({ studentId, student, mode }: { studentId: string; student: any; mode: 'student' | 'counselor' }) {
  const [section, setSection] = useState<StudentSection>('home');
  const terms = getProgramTerms(student?.degree_type);
  const NAV = buildStudentNav(terms.navLabel);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
      <nav className="lg:sticky lg:top-20 self-start">
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-1 gap-1 p-1 rounded-xl bg-card border">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = section === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setSection(n.id)}
                className={cn(
                  'flex flex-col lg:flex-row items-center lg:items-center gap-1 lg:gap-3 px-2 lg:px-3 py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{n.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <main className="min-w-0">
        <CalendarReminderWatcher studentId={studentId} />
        {section === 'home' && <JourneyHome student={student} studentId={studentId} onNavigate={setSection} />}
        {section === 'colleges' && <JourneyColleges studentId={studentId} degreeType={student?.degree_type} />}
        {section === 'tasks' && <JourneyTasks studentId={studentId} />}
        {section === 'calendar' && <JourneyCalendar studentId={studentId} mode={mode} />}
        {section === 'files' && <JourneyFiles studentId={studentId} mode={mode} />}
        {section === 'documents' && <JourneyDocuments studentId={studentId} />}
        {section === 'lab' && <JourneyWritingLab studentId={studentId} />}
        {section === 'detector' && <JourneyDetector studentId={studentId} />}
        {section === 'calculator' && <TuitionCalculator />}
        {section === 'messages' && <JourneyMessages studentId={studentId} />}
        {section === 'profile' && <JourneyProfile studentId={studentId} student={student} />}
      </main>
    </div>
  );
}

export default function StudentWorkspace() {
  const { id } = useParams<{ id: string }>();
  const { role, isLoading: roleLoading } = useCurrentRole();
  const [student, setStudent] = useState<any>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  const checkOnboarding = async (sid: string) => {
    const { data } = await supabase
      .from('student_profile_extras')
      .select('onboarded_at')
      .eq('student_id', sid)
      .maybeSingle();
    setNeedsOnboarding(!data?.onboarded_at);
  };

  useEffect(() => {
    if (!id || roleLoading) return;
    (async () => {
      // App-level guard: if a student is viewing, they may only view their own workspace.
      if (role === 'student') {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setAccessDenied(true);
          setLoading(false);
          return;
        }
        const { data: own } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (!own || own.id !== id) {
          setAccessDenied(true);
          setLoading(false);
          return;
        }
      }

      const { data: s } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      setStudent(s);

      if (role === 'student' && s) {
        await checkOnboarding(id);
      }
      setLoading(false);
    })();
  }, [id, role, roleLoading]);

  if (!id) return null;
  if (accessDenied) return <Navigate to="/student" replace />;

  // Student view path
  if (role === 'student') {
    if (loading || roleLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }
    if (!student) return <Navigate to="/student" replace />;
    if (needsOnboarding) {
      return (
        <JourneyOnboarding
          studentId={id}
          student={student}
          onComplete={() => checkOnboarding(id)}
        />
      );
    }
    const displayName = student.preferred_name || (student.name || '').split(' ')[0] || 'there';
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
        <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-primary text-primary-foreground grid place-items-center text-sm font-semibold">P</div>
              <span className="font-semibold tracking-tight">MyJourney</span>
            </div>
            <div className="text-sm text-muted-foreground hidden sm:block">Hi, {displayName}</div>
          </div>
        </header>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <StudentJourneyView studentId={id} student={student} mode="student" />
        </div>
      </div>
    );
  }

  // Consultant / admin view path
  const studentName = student ? `${student.name} ${student.last_name ?? ''}`.trim() : '';

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl space-y-6 pb-12 animate-fade-in">
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
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="essays">Essays & Drafts</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="student-view">Student view</TabsTrigger>
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

              <TabsContent value="student-view" className="mt-4">
                {student ? (
                  <StudentJourneyView studentId={id} student={student} mode="counselor" />
                ) : (
                  <div className="text-sm text-muted-foreground">Student not found.</div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </MainLayout>
  );
}
