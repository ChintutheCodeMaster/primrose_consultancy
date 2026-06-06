import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Home, GraduationCap, ListChecks, FileText, FolderArchive, FlaskConical, ShieldCheck, MessageSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { JourneyHome } from '@/components/journey/JourneyHome';
import { JourneyColleges } from '@/components/journey/JourneyColleges';
import { JourneyTasks } from '@/components/journey/JourneyTasks';
import { JourneyDocuments } from '@/components/journey/JourneyDocuments';
import { JourneyFiles } from '@/components/journey/JourneyFiles';
import { JourneyWritingLab } from '@/components/journey/JourneyWritingLab';
import { JourneyDetector } from '@/components/journey/JourneyDetector';
import { JourneyMessages } from '@/components/journey/JourneyMessages';
import { JourneyProfile } from '@/components/journey/JourneyProfile';
import { JourneyOnboarding } from '@/components/journey/JourneyOnboarding';

type Section = 'home' | 'colleges' | 'tasks' | 'files' | 'documents' | 'lab' | 'detector' | 'messages' | 'profile';

const NAV: { id: Section; label: string; icon: any }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'colleges', label: 'My Colleges', icon: GraduationCap },
  { id: 'tasks', label: 'Tasks', icon: ListChecks },
  { id: 'files', label: 'Files', icon: FolderArchive },
  { id: 'documents', label: 'Essays', icon: FileText },
  { id: 'lab', label: 'Writing Lab', icon: FlaskConical },
  { id: 'detector', label: 'AI Detector', icon: ShieldCheck },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'profile', label: 'Profile', icon: User },
];

export default function StudentJourney() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [student, setStudent] = useState<any>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [section, setSection] = useState<Section>('home');
  const [invalid, setInvalid] = useState(false);

  const checkOnboarding = async (sid: string) => {
    const { data } = await supabase
      .from('student_profile_extras')
      .select('onboarded_at')
      .eq('student_id', sid)
      .maybeSingle();
    setNeedsOnboarding(!data?.onboarded_at);
  };

  useEffect(() => {
    (async () => {
      if (!token) {
        setInvalid(true);
        setLoading(false);
        return;
      }
      const { data: tokenRow } = await supabase
        .from('student_portal_tokens')
        .select('student_id, status, expires_at')
        .eq('token', token)
        .maybeSingle();
      if (!tokenRow || tokenRow.status !== 'active') {
        setInvalid(true);
        setLoading(false);
        return;
      }
      if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
        setInvalid(true);
        setLoading(false);
        return;
      }
      const sid = tokenRow.student_id;
      setStudentId(sid);
      await supabase
        .from('student_portal_tokens')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('token', token);
      const { data: s } = await supabase.from('students').select('*').eq('id', sid).maybeSingle();
      setStudent(s);
      await checkOnboarding(sid);
      setLoading(false);
    })();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (invalid || !studentId || !student) {
    return <Navigate to="/" replace />;
  }

  if (needsOnboarding) {
    return (
      <JourneyOnboarding
        studentId={studentId}
        student={student}
        onComplete={async () => {
          await checkOnboarding(studentId);
        }}
      />
    );
  }

  const displayName = student.preferred_name || (student.name || '').split(' ')[0] || 'there';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary text-primary-foreground grid place-items-center text-sm font-semibold">
              P
            </div>
            <span className="font-semibold tracking-tight">MyJourney</span>
          </div>
          <div className="text-sm text-muted-foreground hidden sm:block">
            Hi, {displayName}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        {/* Left rail */}
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

        {/* Canvas */}
        <main className="min-w-0">
          {section === 'home' && <JourneyHome student={student} studentId={studentId} onNavigate={setSection} />}
          {section === 'colleges' && <JourneyColleges studentId={studentId} />}
          {section === 'tasks' && <JourneyTasks studentId={studentId} />}
          {section === 'files' && <JourneyFiles studentId={studentId} mode="student" />}
          {section === 'documents' && <JourneyDocuments studentId={studentId} />}
          {section === 'lab' && <JourneyWritingLab studentId={studentId} />}
          {section === 'detector' && <JourneyDetector studentId={studentId} />}
          {section === 'messages' && <JourneyMessages studentId={studentId} />}
          {section === 'profile' && <JourneyProfile studentId={studentId} student={student} />}
        </main>
      </div>
    </div>
  );
}
