import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  Users,
  ListChecks,
  FileText,
  BarChart3,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  MessageSquare,
  CalendarDays,
  School,
  Mail,
  ClipboardCheck,
  UserCheck,
  Library,
  Bell,
  FolderOpen,
  Users2,
  Quote,
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
              <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <span className="font-bold text-base sm:text-lg tracking-tight truncate">
              Primrose <span className="text-muted-foreground font-medium">IEC</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#why" className="hover:text-foreground transition">Why Primrose</a>
            <a href="#ai" className="hover:text-foreground transition">AI</a>
            <a href="#features" className="hover:text-foreground transition">Features</a>
            <a href="#founders" className="hover:text-foreground transition">Founders</a>
            <a href="#pricing" className="hover:text-foreground transition">Pricing</a>
          </nav>
          <a href="#cta" className="flex-shrink-0">
            <Button size="sm" className="text-xs sm:text-sm px-3 sm:px-4">Early access</Button>
          </a>
        </div>
      </header>


      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Colorful gradient blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-violet-400/30 blur-3xl" />
          <div className="absolute -top-20 right-0 h-[360px] w-[360px] rounded-full bg-amber-300/40 blur-3xl" />
          <div className="absolute top-40 left-1/3 h-[300px] w-[300px] rounded-full bg-rose-300/30 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-[300px] w-[300px] rounded-full bg-sky-300/30 blur-3xl" />
        </div>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-12 sm:pt-20 pb-16 sm:pb-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/60 bg-white/70 backdrop-blur px-3 py-1 text-[11px] sm:text-xs font-medium text-violet-700 mb-5 sm:mb-6 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">The admissions practice operating system</span>
            <span className="sm:hidden">Admissions practice OS</span>
          </div>
          <h1
            className="text-[2rem] leading-[1.1] sm:text-5xl md:text-6xl font-bold tracking-tight sm:leading-[1.05] max-w-4xl mx-auto"
            style={{ fontFamily: "Sora, Inter, system-ui, sans-serif" }}
          >
            The{" "}
            <span className="bg-gradient-to-r from-violet-600 via-rose-500 to-amber-500 bg-clip-text text-transparent">
              AI-powered operating system
            </span>{" "}
            for independent educational consultants
          </h1>
          <p className="mt-5 sm:mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed px-2">
            Manage leads, students, essays, deadlines, agreements, payments, and
            outcomes in one calm workspace built specifically for admissions
            consulting.
          </p>
          <div className="mt-8 sm:mt-10 flex items-center justify-center gap-3 flex-wrap">
            <a href="#cta" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto gap-2 bg-gradient-to-r from-violet-600 to-rose-500 hover:from-violet-700 hover:to-rose-600 text-white border-0 shadow-lg shadow-violet-500/20">
                Request early access <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
            <a href="#ai" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-violet-300 text-violet-700 hover:bg-violet-50">See Primrose in action</Button>
            </a>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Built by admissions consultants for admissions consultants.
          </p>
        </div>
      </section>



      {/* Category creation / Why Primrose */}
      <section id="why" className="border-t border-border/60 bg-gradient-to-br from-violet-50 via-background to-rose-50/60">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-14 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 text-violet-700 px-3 py-1 text-xs font-medium mb-6">
            A new category
          </div>

          <h2
            className="text-3xl md:text-4xl font-bold tracking-tight max-w-3xl mx-auto"
            style={{ fontFamily: "Sora, Inter, sans-serif" }}
          >
            Admissions software wasn't built for admissions consultants
          </h2>
          <p className="mt-6 text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Most IECs run their practice on a patchwork of spreadsheets, Google
            Docs, email threads, shared calendars, and generic CRMs that were
            designed for sales teams — not for guiding a student through four
            years of essays, applications, and decisions.
          </p>
          <p className="mt-4 text-foreground font-medium max-w-2xl mx-auto">
            Primrose brings the entire admissions workflow — from first inquiry
            to enrollment — into one platform.
          </p>
          <div className="mt-10 grid sm:grid-cols-3 gap-4 text-left">
            {[
              { before: "Spreadsheets for college lists", after: "Live reach / target / likely tracker" },
              { before: "Inbox chaos for essay drafts", after: "Versioned essay workflow with AI review" },
              { before: "Calendar reminders for deadlines", after: "Deadline radar across every applicant" },
            ].map((row) => (
              <div key={row.before} className="rounded-xl border border-violet-200/70 bg-white shadow-sm overflow-hidden">
                <div className="p-4 bg-rose-50/70 border-b border-rose-100">
                  <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-rose-700 font-semibold bg-rose-100 px-2 py-0.5 rounded-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Before
                  </div>
                  <div className="mt-2 text-sm line-through text-rose-900/60">{row.before}</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-violet-50 to-emerald-50/60">
                  <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-violet-700 font-semibold bg-violet-100 px-2 py-0.5 rounded-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> With Primrose
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">{row.after}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI as core */}
      <AiShowcase />




      {/* Features */}
      <section id="features" className="border-t border-border/60 bg-gradient-to-br from-sky-50 via-background to-emerald-50/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-20">
          <div className="max-w-2xl">
            <h2
              className="text-3xl md:text-4xl font-bold tracking-tight"
              style={{ fontFamily: "Sora, Inter, sans-serif" }}
            >
              Every part of your practice, in one place
            </h2>
            <p className="mt-4 text-muted-foreground">
              Purpose-built for admissions consulting — not retrofitted from a
              sales CRM.
            </p>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={Users}
              title="Inquiries to enrollment"
              body="Capture leads from your website, intake calls, and referrals. Convert qualified inquiries into student records in one click."
            />
            <FeatureCard
              icon={ListChecks}
              title="College list management"
              body="Build reach / target / likely lists per student. Track ED, EA, RD plans, portals, and decisions across every applicant."
            />
            <FeatureCard
              icon={FileText}
              title="Essay workflow & AI review"
              body="Versioned drafts, anchored comments, and Grammarly-style AI feedback on every personal statement and supplement."
            />
            <FeatureCard
              icon={ClipboardCheck}
              title="Recommendation tracking"
              body="Know exactly which recommenders have been asked, which have submitted, and which need a gentle nudge."
            />
            <FeatureCard
              icon={CalendarDays}
              title="Application timeline"
              body="Deadline radar across the entire caseload — never let a Nov 1, Jan 1, or rolling deadline slip again."
            />
            <FeatureCard
              icon={UserCheck}
              title="Interview preparation"
              body="Schedule mocks, track alumni interviews, and keep notes on every prep session in the student record."
            />
            <FeatureCard
              icon={School}
              title="Student & parent portal"
              body="A calm shared workspace for the student — and clean parent communication that keeps families in the loop."
            />
            <FeatureCard
              icon={Library}
              title="University database"
              body="Curated profiles for thousands of universities — UG, grad, MBA, and international — searchable from any student."
            />
            <FeatureCard
              icon={FileText}
              title="Engagement agreements"
              body="Send branded, digitally-signed engagement agreements with package, hourly, edit, or MBA templates."
            />
            <FeatureCard
              icon={Users2}
              title="Team collaboration"
              body="Multi-consultant firms can share students, assign work, and keep visibility across the whole team."
            />
            <FeatureCard
              icon={FolderOpen}
              title="Document management"
              body="Transcripts, test scores, acceptance letters, agreements — every file lives on the student record."
            />
            <FeatureCard
              icon={Bell}
              title="Automated reminders"
              body="Smart follow-ups for unpaid invoices, missing essays, upcoming deadlines, and stalled students."
            />
            <FeatureCard
              icon={Mail}
              title="Parent communication"
              body="Centralized parent threads, update emails, and meeting recaps — without losing your inbox."
            />
            <FeatureCard
              icon={BarChart3}
              title="Practice analytics"
              body="Revenue, conversion funnel, acceptance map, and source ROI — the metrics that actually move the practice."
            />
            <FeatureCard
              icon={GraduationCap}
              title="Alumni & outcomes"
              body="A living record of where students were accepted, where they enrolled, and what they're doing now."
            />
          </div>
        </div>
      </section>

      {/* Social proof / Founders */}
      <section id="founders" className="border-t border-border/60 bg-gradient-to-br from-amber-50/70 via-background to-rose-50/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-xs font-medium mb-5">
                Built by admissions consultants
              </div>

            <h2
              className="text-3xl md:text-4xl font-bold tracking-tight"
              style={{ fontFamily: "Sora, Inter, sans-serif" }}
            >
              Why trust us to build software for your practice?
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              After years leading one of the leading UK and U.S.-focused
              admissions consultancies and helping thousands of students
              navigate competitive admissions processes, we realized that no
              CRM truly reflected how admissions consultants work.
            </p>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Primrose was built to solve that problem — by the people who
              live the workflow every day.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <Stat number="1000s" label="Applicants supported" />
              <Stat number="15+" label="Years of practice" />
              <Stat number="UG · Grad · MBA" label="All applicant types" />
              <Stat number="UK · US · Global" label="Cross-border expertise" />
            </div>
          </div>
          <div className="space-y-4">
            <Testimonial
              quote="Primrose finally replaced the four tools I was juggling. The AI assistant alone saves me hours a week."
              name="Beta consultant, US"
              role="Solo IEC, undergraduate admissions"
            />
            <Testimonial
              quote="It's the first platform that actually thinks like an admissions consultant. The essay workflow is a game-changer."
              name="Beta consultant, UK"
              role="Boutique firm, UG + MBA"
            />
            <Testimonial
              quote="The college list, deadline tracking, and parent communication finally live in one place. My students feel it too."
              name="Beta consultant, International"
              role="Cross-border IEC"
            />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border/60 bg-gradient-to-br from-emerald-50/70 via-background to-sky-50/60">

        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-14 sm:py-20 text-center">
          <h2
            className="text-3xl md:text-4xl font-bold tracking-tight"
            style={{ fontFamily: "Sora, Inter, sans-serif" }}
          >
            Founding consultant pricing
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Early access consultants receive preferred lifetime pricing,
            white-glove onboarding, and direct input into the product roadmap.
            Spots in the Founding Consultant Program are limited.
          </p>
          <div className="mt-8 rounded-2xl border border-primary/30 bg-card p-8 text-left shadow-lg">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-xs uppercase tracking-wide text-primary font-medium">Founding Consultant</div>
                <div className="text-2xl font-bold mt-1">Preferred lifetime rate</div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium">
                Limited beta spots
              </div>
            </div>
            <ul className="mt-6 space-y-2.5 text-sm">
              {[
                "Full access to every Primrose feature",
                "Lifetime discount locked in at the founding rate",
                "Personal onboarding and data migration",
                "Direct line to the product team",
                "Early access to new AI features",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="cta" className="relative overflow-hidden border-t border-border/60 bg-gradient-to-br from-violet-600 via-rose-500 to-amber-500 text-white">
        <div className="pointer-events-none absolute inset-0 -z-0 opacity-30">
          <div className="absolute -top-20 left-10 h-72 w-72 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute bottom-0 right-10 h-80 w-80 rounded-full bg-amber-200/40 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 py-16 sm:py-24 text-center">
          <h2
            className="text-3xl md:text-5xl font-bold tracking-tight"
            style={{ fontFamily: "Sora, Inter, sans-serif" }}
          >
            Run your admissions practice on Primrose
          </h2>
          <p className="mt-5 text-white/90 text-lg">
            Join the Founding Consultant Program and help shape the operating
            system for modern admissions consulting.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
            <Link to="/app">
              <Button size="lg" className="gap-2 bg-white text-violet-700 hover:bg-white/90 border-0 shadow-lg">
                Request early access <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="mailto:hello@primrose-iec.com">
              <Button size="lg" variant="outline" className="border-white/70 text-white bg-white/10 hover:bg-white/20 hover:text-white">Book a demo</Button>
            </a>
          </div>
        </div>
      </section>


      <footer className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            <span>© {new Date().getFullYear()} Primrose IEC — The admissions practice operating system</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
            <a href="#cta" className="hover:text-foreground">Early access</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

const FEATURE_ACCENTS = [
  "bg-violet-100 text-violet-600 group-hover:bg-violet-200",
  "bg-rose-100 text-rose-600 group-hover:bg-rose-200",
  "bg-amber-100 text-amber-700 group-hover:bg-amber-200",
  "bg-sky-100 text-sky-600 group-hover:bg-sky-200",
  "bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200",
  "bg-fuchsia-100 text-fuchsia-600 group-hover:bg-fuchsia-200",
  "bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200",
  "bg-teal-100 text-teal-600 group-hover:bg-teal-200",
];

let __featureIdx = 0;

function FeatureCard({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  const accent = FEATURE_ACCENTS[__featureIdx++ % FEATURE_ACCENTS.length];
  return (
    <div className="group rounded-2xl border border-border/70 bg-white p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center mb-4 transition-colors ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-semibold text-base">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}


function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xl font-bold tracking-tight">{number}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function Testimonial({
  quote,
  name,
  role,
}: {
  quote: string;
  name: string;
  role: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <Quote className="h-5 w-5 text-primary/50 mb-3" />
      <p className="text-sm leading-relaxed text-foreground">"{quote}"</p>
      <div className="mt-4 text-xs">
        <div className="font-medium">{name}</div>
        <div className="text-muted-foreground">{role}</div>
      </div>
    </div>
  );
}

type AiAnswer = {
  question: string;
  headline: string;
  rows: { name: string; meta: string }[];
  cta: string;
};

const AI_ANSWERS: AiAnswer[] = [
  {
    question: "Which seniors haven't started their Common App personal statement?",
    headline: "3 seniors have no draft started:",
    rows: [
      { name: "Maya Chen", meta: "last met 6 days ago" },
      { name: "Jordan Patel", meta: "Common App opens in 4 days" },
      { name: "Sam Rivera", meta: "last met 12 days ago" },
    ],
    cta: "→ Open all three students",
  },
  {
    question: "Which students are missing recommendation letters?",
    headline: "4 students still need at least one rec letter:",
    rows: [
      { name: "Aiden Walker", meta: "2 of 3 letters received" },
      { name: "Priya Shah", meta: "0 of 2 letters received" },
      { name: "Liam O'Connor", meta: "1 of 3 letters received" },
      { name: "Noor Haddad", meta: "1 of 2 letters received" },
    ],
    cta: "→ Email recommenders",
  },
  {
    question: "Which seniors haven't started their supplemental essays?",
    headline: "5 seniors have no supplement drafts yet:",
    rows: [
      { name: "Ethan Park", meta: "UPenn supplement due Nov 1" },
      { name: "Sofia Alvarez", meta: "USC supplement due Nov 1" },
      { name: "Marcus Bell", meta: "Northwestern Why Us due Jan 1" },
      { name: "Hannah Goldberg", meta: "Yale 3 supplements outstanding" },
    ],
    cta: "→ Send writing nudge",
  },
  {
    question: "Which applications are due in the next 14 days?",
    headline: "12 applications across 7 students:",
    rows: [
      { name: "Stanford REA", meta: "Nov 1 · 3 students" },
      { name: "Georgetown EA", meta: "Nov 1 · 2 students" },
      { name: "UNC Chapel Hill EA", meta: "Oct 15 · 4 students" },
      { name: "MIT EA", meta: "Nov 1 · 3 students" },
    ],
    cta: "→ Open deadline radar",
  },
  {
    question: "Which families have an outstanding balance?",
    headline: "3 families with overdue invoices ($14,500 total):",
    rows: [
      { name: "The Chen family", meta: "$6,000 · 22 days overdue" },
      { name: "The Patel family", meta: "$5,500 · 9 days overdue" },
      { name: "The Rivera family", meta: "$3,000 · 4 days overdue" },
    ],
    cta: "→ Send payment reminders",
  },
  {
    question: "Where did last year's cohort get accepted?",
    headline: "Class of 2025 — 28 students, 142 acceptances:",
    rows: [
      { name: "Ivy + Stanford + MIT", meta: "9 acceptances" },
      { name: "Top-20 US universities", meta: "47 acceptances" },
      { name: "Oxbridge + UK G5", meta: "12 acceptances" },
      { name: "Top US liberal arts colleges", meta: "18 acceptances" },
    ],
    cta: "→ Open outcomes report",
  },
];

function AiShowcase() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const answer = AI_ANSWERS[activeIdx];

  // Typewriter + auto-advance loop
  useEffect(() => {
    setTyped("");
    setShowAnswer(false);
    const full = answer.question;
    let i = 0;
    let revealTimer: ReturnType<typeof setTimeout> | undefined;
    let advanceTimer: ReturnType<typeof setTimeout> | undefined;
    const typeTimer = setInterval(() => {
      i += 1;
      setTyped(full.slice(0, i));
      if (i >= full.length) {
        clearInterval(typeTimer);
        revealTimer = setTimeout(() => setShowAnswer(true), 350);
        advanceTimer = setTimeout(() => {
          setActiveIdx((idx) => (idx + 1) % AI_ANSWERS.length);
        }, 4200);
      }
    }, 38);
    return () => {
      clearInterval(typeTimer);
      if (revealTimer) clearTimeout(revealTimer);
      if (advanceTimer) clearTimeout(advanceTimer);
    };
  }, [activeIdx, answer.question]);


  return (
    <section id="ai" className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24">
      <div className="grid md:grid-cols-2 gap-12 items-start">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium mb-5">
            <Sparkles className="h-3.5 w-3.5" /> Core to the platform
          </div>
          <h2
            className="text-3xl md:text-4xl font-bold tracking-tight"
            style={{ fontFamily: "Sora, Inter, sans-serif" }}
          >
            Your AI admissions operations assistant
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Ask Primrose anything about your practice in plain English. No
            filters to build, no reports to configure — your entire caseload,
            instantly queryable.
          </p>
          <p className="mt-6 text-xs uppercase tracking-wide text-muted-foreground font-medium">
            Questions consultants ask Primrose
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {AI_ANSWERS.map((a, i) => {
              const isActive = i === activeIdx;
              return (
                <li
                  key={a.question}
                  className={
                    "flex items-start gap-3 rounded-lg px-3 py-2 border transition-colors " +
                    (isActive
                      ? "bg-primary/5 border-primary/30 text-foreground"
                      : "border-transparent text-muted-foreground")
                  }
                >
                  <MessageSquare
                    className={
                      "h-4 w-4 mt-0.5 flex-shrink-0 " +
                      (isActive ? "text-primary" : "text-muted-foreground")
                    }
                  />
                  <span className="italic">"{a.question}"</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-6 text-sm text-foreground font-medium">
            Plus AI-powered essay review for line edits, structural feedback,
            and voice notes — sent straight to your student as inline comments.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-xl md:sticky md:top-24">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex-1 space-y-3 min-w-0">
              <div className="rounded-xl bg-muted/60 p-3 text-sm min-h-[3.5rem]">
                {typed}
                <span
                  className="inline-block w-[2px] h-4 align-middle bg-foreground/70 ml-0.5 animate-pulse"
                  aria-hidden
                />
              </div>
              {showAnswer && (
                <div
                  key={activeIdx}
                  className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-sm space-y-2 animate-fade-in"
                >
                  <div className="font-medium">{answer.headline}</div>
                  <ul className="space-y-1.5 text-muted-foreground">
                    {answer.rows.map((r) => (
                      <li key={r.name} className="flex items-center gap-2">
                        <UserCheck className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>
                          <span className="text-foreground">{r.name}</span>
                          <span className="mx-1">—</span>
                          {r.meta}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-2 text-xs text-primary">{answer.cta}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

