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
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">
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
          <a href="#cta">
            <Button size="sm">Request early access</Button>
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground mb-6">
          <Sparkles className="h-3.5 w-3.5" />
          The admissions practice operating system
        </div>
        <h1
          className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.05] max-w-4xl mx-auto"
          style={{ fontFamily: "Sora, Inter, system-ui, sans-serif" }}
        >
          The AI-powered operating system for independent educational consultants
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Manage leads, students, essays, deadlines, agreements, payments, and
          outcomes in one calm workspace built specifically for admissions
          consulting.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
          <a href="#cta">
            <Button size="lg" className="gap-2">
              Request early access <ArrowRight className="h-4 w-4" />
            </Button>
          </a>
          <a href="#ai">
            <Button size="lg" variant="outline">See Primrose in action</Button>
          </a>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Built by admissions consultants for admissions consultants.
        </p>
      </section>

      {/* Category creation / Why Primrose */}
      <section id="why" className="border-t border-border/60 bg-muted/20">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium mb-6">
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
              <div key={row.before} className="rounded-xl border border-border bg-card p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Before</div>
                <div className="text-sm line-through text-muted-foreground">{row.before}</div>
                <div className="mt-3 text-xs uppercase tracking-wide text-primary">With Primrose</div>
                <div className="text-sm font-medium">{row.after}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI as core */}
      <AiShowcase />




      {/* Features */}
      <section id="features" className="border-t border-border/60 bg-muted/20">
        <div className="mx-auto max-w-6xl px-6 py-20">
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
      <section id="founders" className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium mb-5">
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
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border/60 bg-muted/20">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
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
      <section id="cta" className="border-t border-border/60">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h2
            className="text-3xl md:text-5xl font-bold tracking-tight"
            style={{ fontFamily: "Sora, Inter, sans-serif" }}
          >
            Run your admissions practice on Primrose
          </h2>
          <p className="mt-5 text-muted-foreground text-lg">
            Join the Founding Consultant Program and help shape the operating
            system for modern admissions consulting.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
            <Link to="/app">
              <Button size="lg" className="gap-2">
                Request early access <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="mailto:hello@primrose-iec.com">
              <Button size="lg" variant="outline">Book a demo</Button>
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
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

function FeatureCard({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 hover:shadow-md hover:border-primary/30 transition">
      <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
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
