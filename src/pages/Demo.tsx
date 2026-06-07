import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { GraduationCap, Users, Heart, Sparkles, ArrowRight, ExternalLink } from 'lucide-react';

export default function Demo() {
  const [sampleStudentId, setSampleStudentId] = useState<string | null>(null);
  const [sampleToken, setSampleToken] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase
        .from('students')
        .select('id')
        .eq('did_not_continue', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (s?.id) {
        setSampleStudentId(s.id);
        const { data: t } = await supabase
          .from('student_portal_tokens')
          .select('token')
          .eq('student_id', s.id)
          .limit(1)
          .maybeSingle();
        if (t?.token) setSampleToken(t.token);
      }
    })();
  }, []);

  const cards = [
    {
      label: 'Consultant',
      title: 'Enter as an IEC',
      desc: 'The Command Center, Rose your AI strategist, the Acceptance Wall, full CRM.',
      icon: Users,
      gradient: 'from-emerald-500 via-teal-600 to-cyan-700',
      to: '/app',
      cta: 'Open Command Center',
    },
    {
      label: 'Student',
      title: 'Enter as a Student',
      desc: 'The student journey: calendar, college list, essays, AI coach, and progress.',
      icon: GraduationCap,
      gradient: 'from-indigo-500 via-violet-600 to-purple-700',
      to: sampleToken ? `/journey/${sampleToken}` : sampleStudentId ? `/journey/demo` : '/students',
      cta: sampleToken ? 'Open Student Journey' : 'See Students',
    },
    {
      label: 'Parent',
      title: 'Enter as a Parent',
      desc: 'A calm, read-only window into the student\'s progress, milestones and wins.',
      icon: Heart,
      gradient: 'from-rose-500 via-pink-600 to-fuchsia-700',
      to: sampleToken ? `/journey/${sampleToken}` : '/',
      cta: 'Open Parent View',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-20">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-white/70 px-4 py-1.5 text-xs font-medium text-emerald-700 shadow-sm backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            Live demo · Primrose IEC
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
            The operating system for{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Independent Educational Consultants
            </span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Pick the role you want to experience. Everything below is the real product running on real data.
          </p>
        </div>

        {/* Cards */}
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {cards.map((c, i) => (
            <Link
              key={c.label}
              to={c.to}
              className="group relative flex flex-col overflow-hidden rounded-3xl border bg-card p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-2xl animate-slide-up"
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}
            >
              <div className={`absolute -right-12 -top-12 h-44 w-44 rounded-full bg-gradient-to-br ${c.gradient} opacity-20 blur-2xl transition-opacity group-hover:opacity-40`} />

              <div className={`relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${c.gradient} text-white shadow-lg`}>
                <c.icon className="h-7 w-7" />
              </div>

              <p className="relative mt-6 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {c.label}
              </p>
              <h2 className="relative mt-1 text-2xl font-semibold">{c.title}</h2>
              <p className="relative mt-3 text-sm leading-relaxed text-muted-foreground">{c.desc}</p>

              <div className="relative mt-8 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{c.cta}</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>

        {/* Highlights */}
        <div className="mt-16 grid gap-4 rounded-3xl border bg-card/60 p-8 backdrop-blur sm:grid-cols-3">
          <Highlight title="AI Daily Brief" desc="Rose summarizes your practice every morning." />
          <Highlight title="Acceptance Wall" desc="Every student win, immortalized as a tile." />
          <Highlight title="Practice Intelligence" desc="Pipeline, deadlines, cold leads, all in one view." />
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              Back to marketing site
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Highlight({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
