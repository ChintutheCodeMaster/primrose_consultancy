import { useEffect, useState } from 'react';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
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
import { JourneyEssays } from '@/components/journey/JourneyEssays';
import { JourneyWritingLab } from '@/components/journey/JourneyWritingLab';
import { JourneyPrimroseLab } from '@/components/journey/JourneyPrimroseLab';
import { JourneyDetector } from '@/components/journey/JourneyDetector';
import { JourneyMessages } from '@/components/journey/JourneyMessages';
import { JourneyProfile } from '@/components/journey/JourneyProfile';
import { JourneyOnboarding } from '@/components/journey/JourneyOnboarding';
import { CalendarReminderWatcher } from '@/components/journey/CalendarReminderWatcher';
// import { TuitionCalculator } from '@/components/workspace/TuitionCalculator';
import TuitionCalculator from '@/components/workspace/TuitionCalculator';
import { JourneyScholarshipFinder } from '@/components/journey/JourneyScholarshipFinder';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getProgramTerms } from '@/lib/programTerms';
import { ArrowLeft, ExternalLink, Loader2, Sparkles, Home, GraduationCap, ListChecks, CalendarDays, FolderArchive, FileText, FlaskConical, ShieldCheck, DollarSign, MessageSquare, User, Trophy, LogOut } from 'lucide-react';

type StudentSection =
  | 'home' | 'colleges' | 'tasks' | 'calendar' | 'files'
  | 'documents' | 'lab' | 'detector' | 'calculator' | 'scholarships' | 'messages' | 'profile';

const buildStudentNav = (collegesLabel: string): { id: StudentSection; label: string; icon: any }[] => [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'colleges', label: collegesLabel, icon: GraduationCap },
  { id: 'tasks', label: 'Tasks', icon: ListChecks },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'files', label: 'Files', icon: FolderArchive },
  { id: 'documents', label: 'Essays', icon: FileText },
  { id: 'lab', label: 'Primrose Lab', icon: FlaskConical },
  { id: 'detector', label: 'AI Detector', icon: ShieldCheck },
  { id: 'calculator', label: 'Living Cost', icon: DollarSign },
  { id: 'scholarships', label: 'Scholarships', icon: Trophy },
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
    <div className="grid grid-cols-1 lg:grid-cols-[230px_1fr] gap-6">
      <nav className="lg:sticky lg:top-20 self-start animate-slide-up">
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-1 gap-1 p-2 rounded-2xl glass shadow-[0_8px_30px_-12px_hsl(222_47%_11%/0.12)]">
          {NAV.map((n, i) => {
            const Icon = n.icon;
            const active = section === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setSection(n.id)}
                style={{ animationDelay: `${i * 30}ms` }}
                className={cn(
                  'group relative flex flex-col lg:flex-row items-center lg:items-center gap-1 lg:gap-3 px-2 lg:px-3.5 py-2.5 rounded-xl text-xs lg:text-sm font-medium transition-all duration-300 press-soft animate-slide-up-sm',
                  active
                    ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-md shadow-primary/25'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/60',
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 hidden lg:block h-6 w-1 -translate-y-1/2 rounded-r-full bg-accent" />
                )}
                <Icon className={cn('h-4 w-4 shrink-0 transition-transform', active ? '' : 'group-hover:scale-110')} />
                <span className="truncate">{n.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <main key={section} className="min-w-0 animate-fade-in-fast">
        <CalendarReminderWatcher studentId={studentId} />
        {section === 'home' && <JourneyHome student={student} studentId={studentId} onNavigate={setSection} />}
        {section === 'colleges' && <JourneyColleges studentId={studentId} degreeType={student?.degree_type} />}
        {section === 'tasks' && <JourneyTasks studentId={studentId} />}
        {section === 'calendar' && <JourneyCalendar studentId={studentId} mode={mode} />}
        {section === 'files' && <JourneyFiles studentId={studentId} mode={mode} />}
        {section === 'documents' && (mode === 'student' ? <JourneyEssays /> : <JourneyDocuments studentId={studentId} />)}
        {section === 'lab' && (mode === 'student' ? <JourneyPrimroseLab /> : <JourneyWritingLab studentId={studentId} />)}
        {section === 'detector' && <JourneyDetector studentId={studentId} />}
        {section === 'calculator' && <TuitionCalculator onNavigate={(s) => setSection(s as StudentSection)} />}
        {section === 'scholarships' && <JourneyScholarshipFinder />}
        {section === 'messages' && <JourneyMessages studentId={studentId} />}
        {section === 'profile' && <JourneyProfile studentId={studentId} student={student} />}
      </main>
    </div>
  );
}

export default function StudentWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role, isLoading: roleLoading } = useCurrentRole();
  const [student, setStudent] = useState<any>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleLogout = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      toast.success('Signed out.');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not sign out.');
      setSigningOut(false);
    }
  };

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
      <div className="relative min-h-screen overflow-hidden bg-background bg-mesh-warm">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 -left-24 h-[480px] w-[480px] rounded-full bg-rose-400/15 blur-3xl animate-float" />
          <div className="absolute -top-20 right-0 h-[400px] w-[400px] rounded-full bg-amber-300/20 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>
        <header className="sticky top-0 z-30 border-b border-white/30 bg-white/60 backdrop-blur-xl supports-[backdrop-filter]:bg-white/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="relative h-8 w-8 rounded-lg bg-gradient-to-br from-rose-500 to-amber-500 text-white grid place-items-center text-sm font-semibold shadow-md shadow-rose-500/25">
                <span className="relative">P</span>
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/30 to-transparent" />
              </div>
              <span className="font-semibold tracking-tight text-lg" style={{ fontFamily: 'Sora, Inter, sans-serif' }}>MyJourney</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Hi,</span>
                <span className="font-semibold text-foreground">{displayName}</span>
                <span className="ml-1">👋</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={signingOut}
                className="rounded-xl bg-white/70 backdrop-blur press-soft gap-1.5 border-rose-200/60 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
              >
                {signingOut ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">Log out</span>
              </Button>
            </div>
          </div>
        </header>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 animate-fade-in">
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
