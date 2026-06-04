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
            <a href="#features" className="hover:text-foreground transition">Features</a>
            <a href="#workflow" className="hover:text-foreground transition">Workflow</a>
            <a href="#pricing" className="hover:text-foreground transition">Pricing</a>
          </nav>
          <Link to="/app">
            <Button size="sm">Sign in</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground mb-6">
          <Sparkles className="h-3.5 w-3.5" />
          Built for independent educational consultants
        </div>
        <h1
          className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.05] max-w-3xl mx-auto"
          style={{ fontFamily: "Sora, Inter, system-ui, sans-serif" }}
        >
          The CRM for the modern educational consultant
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Manage every inquiry, student, college list, application, essay and
          payment in one calm, organized workspace — so you can spend your time
          where it matters: with your students.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3">
          <Link to="/app">
            <Button size="lg" className="gap-2">
              Open your dashboard <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <a href="#features">
            <Button size="lg" variant="outline">See features</Button>
          </a>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Trusted by independent consultants advising students worldwide.
        </p>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border/60 bg-muted/20">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ fontFamily: "Sora, Inter, sans-serif" }}>
              Everything your practice needs, nothing it doesn't
            </h2>
            <p className="mt-4 text-muted-foreground">
              Replace the tangle of spreadsheets, sticky notes and inbox
              searches with one purpose-built workspace.
            </p>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={Users}
              title="Inquiries to enrollment"
              body="Capture leads from your website, intake calls and referrals. Convert them into students in a click and keep every touchpoint."
            />
            <FeatureCard
              icon={ListChecks}
              title="College list & applications"
              body="Build reach/target/likely lists per student. Track deadlines, application plans (ED/EA/RD), portals, essays and decisions."
            />
            <FeatureCard
              icon={FileText}
              title="Engagement agreements"
              body="Send branded, digitally-signed engagement agreements with package, hourly, edit or MBA templates."
            />
            <FeatureCard
              icon={BarChart3}
              title="Practice analytics"
              body="See revenue, conversion funnel, where students get accepted and which sources actually move the needle."
            />
            <FeatureCard
              icon={Sparkles}
              title="AI assistant"
              body="Ask anything about your practice in plain English — 'who's missing an essay due Friday?' — and jump straight to the record."
            />
            <FeatureCard
              icon={GraduationCap}
              title="Alumni & outcomes"
              body="Keep alumni in one place with the schools they got into, where they enrolled and what they're up to now."
            />
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ fontFamily: "Sora, Inter, sans-serif" }}>
              Designed around the way you actually work
            </h2>
            <p className="mt-4 text-muted-foreground">
              Whether you advise on US college admissions, graduate school,
              boarding school or international university placement — your
              workflow lives end-to-end inside Primrose.
            </p>
            <ul className="mt-8 space-y-3 text-sm">
              {[
                "Website inquiries auto-populate as new leads",
                "Convert qualified inquiries into student records with one click",
                "Track every meeting, essay draft and recommendation request",
                "Send agreements, collect e-signatures, and follow the money",
                "Stay on top of deadlines with smart follow-up reminders",
              ].map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{line}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
            <div className="space-y-3">
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="h-2 w-full rounded bg-muted/60" />
              <div className="h-2 w-5/6 rounded bg-muted/60" />
              <div className="grid grid-cols-3 gap-3 pt-4">
                <div className="h-20 rounded-lg bg-primary/10 border border-primary/20" />
                <div className="h-20 rounded-lg bg-muted/60" />
                <div className="h-20 rounded-lg bg-accent/10 border border-accent/20" />
              </div>
              <div className="h-2 w-full rounded bg-muted/60 mt-4" />
              <div className="h-2 w-4/6 rounded bg-muted/60" />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border/60 bg-muted/20">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ fontFamily: "Sora, Inter, sans-serif" }}>
            Simple pricing, designed for solo consultants and firms alike
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Full pricing and multi-seat plans launch with the public release.
            Want early access? Open your dashboard and start exploring.
          </p>
          <div className="mt-8">
            <Link to="/app">
              <Button size="lg" className="gap-2">
                Open dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            <span>© {new Date().getFullYear()} Primrose IEC</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
            <Link to="/app" className="hover:text-foreground">Sign in</Link>
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
    <div className="rounded-2xl border border-border bg-card p-6 hover:shadow-md transition">
      <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
