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
      gradient: 'from-violet-600 to-indigo-600',
      ring: 'ring-violet-200',
      to: '/app',
      cta: 'Open Command Center',
    },
    {
      label: 'Student',
      title: 'Enter as a Student',
      desc: 'The student journey: calendar, college list, essays, AI coach, and progress.',
      icon: GraduationCap,
      gradient: 'from-rose-500 to-amber-500',
      ring: 'ring-rose-200',
      to: sampleToken ? `/journey/${sampleToken}` : sampleStudentId ? `/journey/demo` : '/students',
      cta: sampleToken ? 'Open Student Journey' : 'See Students',
    },
    {
      label: 'Parent',
      title: 'Enter as a Parent',
      desc: "A calm, read-only window into the student's progress, milestones and wins.",
      icon: Heart,
      gradient: 'from-sky-500 to-emerald-500',
      ring: 'ring-sky-200',
      to: sampleToken ? `/journey/${sampleToken}` : '/',
      cta: 'Open Parent View',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Hero with colorful gradient blobs (match Landing) */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-violet-400/30 blur-3xl" />
          <div className="absolute -top-20 right-0 h-[360px] w-[360px] rounded-full bg-amber-300/40 blur-3xl" />
          <div className="absolute top-40 left-1/3 h-[300px] w-[300px] rounded-full bg-rose-300/30 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-[300px] w-[300px] rounded-full bg-sky-300/30 blur-3xl" />
        </div>

        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-12 pb-10 sm:pt-20 sm:pb-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/60 bg-white/70 backdrop-blur px-3 py-1 text-[11px] sm:text-xs font-medium text-violet-700 mb-5 sm:mb-6 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Live demo · Primrose IEC
          </div>
          <h1
            className="text-[1.85rem] leading-[1.15] sm:text-4xl md:text-5xl font-bold tracking-tight sm:leading-[1.05] max-w-3xl mx-auto"
            style={{ fontFamily: 'Sora, Inter, system-ui, sans-serif' }}
          >
            Step inside the{' '}
            <span className="bg-gradient-to-r from-violet-600 via-rose-500 to-amber-500 bg-clip-text text-transparent">
              admissions operating system
            </span>
          </h1>
          <p className="mt-4 sm:mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Pick the role you want to experience. Everything below is the real
            product running on real data.
          </p>
        </div>

        {/* Cards */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-10">
          <div className="grid gap-4 sm:gap-5 md:grid-cols-3">
            {cards.map((c, i) => (

              <Link
                key={c.label}
                to={c.to}
                className={`group relative flex flex-col overflow-hidden rounded-3xl border border-violet-200/60 bg-white/80 backdrop-blur p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-2xl hover:ring-2 ${c.ring} animate-slide-up`}
                style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}
              >
                <div className={`absolute -right-12 -top-12 h-44 w-44 rounded-full bg-gradient-to-br ${c.gradient} opacity-20 blur-2xl transition-opacity group-hover:opacity-40`} />

                <div className={`relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${c.gradient} text-white shadow-lg`}>
                  <c.icon className="h-7 w-7" />
                </div>

                <p className="relative mt-6 text-xs font-medium uppercase tracking-widest text-violet-600">
                  {c.label}
                </p>
                <h2
                  className="relative mt-1 text-2xl font-semibold"
                  style={{ fontFamily: 'Sora, Inter, sans-serif' }}
                >
                  {c.title}
                </h2>
                <p className="relative mt-3 text-sm leading-relaxed text-muted-foreground">{c.desc}</p>

                <div className="relative mt-8 flex items-center justify-between">
                  <span className={`text-sm font-semibold bg-gradient-to-r ${c.gradient} bg-clip-text text-transparent`}>{c.cta}</span>
                  <ArrowRight className="h-5 w-5 text-violet-600 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="border-t border-border/60 bg-gradient-to-br from-violet-50 via-background to-rose-50/60">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <div className="grid gap-6 rounded-3xl border border-violet-200/60 bg-white/70 backdrop-blur p-8 sm:grid-cols-3">
            <Highlight color="bg-violet-500" title="AI Daily Brief" desc="Rose summarizes your practice every morning." />
            <Highlight color="bg-rose-500" title="Acceptance Wall" desc="Every student win, immortalized as a tile." />
            <Highlight color="bg-amber-500" title="Practice Intelligence" desc="Pipeline, deadlines, cold leads, all in one view." />
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-sm">
            <Button asChild variant="ghost" size="sm" className="text-violet-700 hover:text-violet-900 hover:bg-violet-50">
              <Link to="/">
                Back to marketing site
                <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Highlight({ title, desc, color }: { title: string; desc: string; color: string }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <div className={`h-1.5 w-1.5 rounded-full ${color}`} />
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
