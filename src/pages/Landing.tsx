// import { useEffect, useState } from "react";
// import { Link } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import {
//   GraduationCap,
//   Users,
//   ListChecks,
//   FileText,
//   BarChart3,
//   Sparkles,
//   ArrowRight,
//   CheckCircle2,
//   MessageSquare,
//   CalendarDays,
//   School,
//   Mail,
//   ClipboardCheck,
//   UserCheck,
//   Library,
//   Bell,
//   FolderOpen,
//   Users2,
//   Quote,
// } from "lucide-react";

// export default function Landing() {
//   return (
//     <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
//       {/* Nav */}
//       <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-30">
//         <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
//           <Link to="/" className="flex items-center gap-2 min-w-0">
//             <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
//               <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5" />
//             </div>
//             <span className="font-bold text-base sm:text-lg tracking-tight truncate">
//               Primrose
//             </span>
//           </Link>
//           <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
//             <a href="#why" className="hover:text-foreground transition">Why Primrose</a>
//             <a href="#ai" className="hover:text-foreground transition">AI</a>
//             <a href="#features" className="hover:text-foreground transition">Features</a>
//             <a href="#founders" className="hover:text-foreground transition">Founders</a>
//             <a href="#pricing" className="hover:text-foreground transition">Pricing</a>
//           </nav>
//           <a href="#cta" className="flex-shrink-0">
//             <Button size="sm" className="text-xs sm:text-sm px-3 sm:px-4">Early access</Button>
//           </a>
//         </div>
//       </header>


//       {/* Hero */}
//       <section className="relative overflow-hidden">
//         {/* Colorful gradient blobs */}
//         <div className="pointer-events-none absolute inset-0 -z-10">
//           <div className="absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-violet-400/30 blur-3xl" />
//           <div className="absolute -top-20 right-0 h-[360px] w-[360px] rounded-full bg-amber-300/40 blur-3xl" />
//           <div className="absolute top-40 left-1/3 h-[300px] w-[300px] rounded-full bg-rose-300/30 blur-3xl" />
//           <div className="absolute bottom-0 right-1/4 h-[300px] w-[300px] rounded-full bg-sky-300/30 blur-3xl" />
//         </div>
//         <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-12 sm:pt-20 pb-16 sm:pb-24 text-center">
//           <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/60 bg-white/70 backdrop-blur px-3 py-1 text-[11px] sm:text-xs font-medium text-violet-700 mb-5 sm:mb-6 shadow-sm">
//             <Sparkles className="h-3.5 w-3.5" />
//             <span className="hidden sm:inline">The admissions practice operating system</span>
//             <span className="sm:hidden">Admissions practice OS</span>
//           </div>
//           <h1
//             className="text-[2rem] leading-[1.1] sm:text-5xl md:text-6xl font-bold tracking-tight sm:leading-[1.05] max-w-4xl mx-auto"
//             style={{ fontFamily: "Sora, Inter, system-ui, sans-serif" }}
//           >
//             The{" "}
//             <span className="bg-gradient-to-r from-violet-600 via-rose-500 to-amber-500 bg-clip-text text-transparent">
//               AI-powered operating system
//             </span>{" "}
//             for independent educational consultants
//           </h1>
//           <p className="mt-5 sm:mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed px-2">
//             Manage leads, students, essays, deadlines, agreements, payments, and
//             outcomes in one calm workspace built specifically for admissions
//             consulting.
//           </p>
//           <div className="mt-8 sm:mt-10 flex items-center justify-center gap-3 flex-wrap">
//             <a href="#cta" className="w-full sm:w-auto">
//               <Button size="lg" className="w-full sm:w-auto gap-2 bg-gradient-to-r from-violet-600 to-rose-500 hover:from-violet-700 hover:to-rose-600 text-white border-0 shadow-lg shadow-violet-500/20">
//                 Request early access <ArrowRight className="h-4 w-4" />
//               </Button>
//             </a>
//             <a href="#ai" className="w-full sm:w-auto">
//               <Button size="lg" variant="outline" className="w-full sm:w-auto border-violet-300 text-violet-700 hover:bg-violet-50">See Primrose in action</Button>
//             </a>
//           </div>
//           <p className="mt-4 text-xs text-muted-foreground">
//             Built by admissions consultants for admissions consultants.
//           </p>
//         </div>
//       </section>



//       {/* Category creation / Why Primrose */}
//       <section id="why" className="border-t border-border/60 bg-gradient-to-br from-violet-50 via-background to-rose-50/60">
//         <div className="mx-auto max-w-5xl px-4 sm:px-6 py-14 sm:py-20 text-center">
//           <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 text-violet-700 px-3 py-1 text-xs font-medium mb-6">
//             A new category
//           </div>

//           <h2
//             className="text-3xl md:text-4xl font-bold tracking-tight max-w-3xl mx-auto"
//             style={{ fontFamily: "Sora, Inter, sans-serif" }}
//           >
//             Admissions software wasn't built for admissions consultants
//           </h2>
//           <p className="mt-6 text-muted-foreground max-w-2xl mx-auto leading-relaxed">
//             Most admissions consultants run their practice on a patchwork of
//             spreadsheets, Google Docs, email threads, shared calendars, and
//             generic CRMs that were designed for sales teams — not for guiding a
//             student through four years of essays, applications, and decisions.
//           </p>
//           <p className="mt-4 text-foreground font-medium max-w-2xl mx-auto">
//             Primrose brings the entire admissions workflow — from first inquiry
//             to enrollment — into one platform.
//           </p>
//           <div className="mt-10 grid sm:grid-cols-3 gap-4 text-left">
//             {[
//               { before: "Spreadsheets for college lists", after: "Live reach / target / likely tracker" },
//               { before: "Inbox chaos for essay drafts", after: "Versioned essay workflow with AI review" },
//               { before: "Calendar reminders for deadlines", after: "Deadline radar across every applicant" },
//             ].map((row) => (
//               <div key={row.before} className="rounded-xl border border-violet-200/70 bg-white shadow-sm overflow-hidden">
//                 <div className="p-4 bg-rose-50/70 border-b border-rose-100">
//                   <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-rose-700 font-semibold bg-rose-100 px-2 py-0.5 rounded-full">
//                     <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Before
//                   </div>
//                   <div className="mt-2 text-sm line-through text-rose-900/60">{row.before}</div>
//                 </div>
//                 <div className="p-4 bg-gradient-to-br from-violet-50 to-emerald-50/60">
//                   <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-violet-700 font-semibold bg-violet-100 px-2 py-0.5 rounded-full">
//                     <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> With Primrose
//                   </div>
//                   <div className="mt-2 text-sm font-semibold text-slate-900">{row.after}</div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* AI as core */}
//       <AiShowcase />




//       {/* Features */}
//       <section id="features" className="border-t border-border/60 bg-gradient-to-br from-sky-50 via-background to-emerald-50/60">
//         <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-20">
//           <div className="max-w-2xl">
//             <h2
//               className="text-3xl md:text-4xl font-bold tracking-tight"
//               style={{ fontFamily: "Sora, Inter, sans-serif" }}
//             >
//               Every part of your practice, in one place
//             </h2>
//             <p className="mt-4 text-muted-foreground">
//               Purpose-built for admissions consulting — not retrofitted from a
//               sales CRM.
//             </p>
//           </div>
//           <div className="mt-12 grid md:grid-cols-3 gap-6">
//             <FeatureCard
//               icon={Users}
//               title="Inquiries to enrollment"
//               body="Capture leads from your website, intake calls, and referrals. Convert qualified inquiries into student records in one click."
//             />
//             <FeatureCard
//               icon={ListChecks}
//               title="College list management"
//               body="Build reach / target / likely lists per student. Track ED, EA, RD plans, portals, and decisions across every applicant."
//             />
//             <FeatureCard
//               icon={FileText}
//               title="Essay workflow & AI review"
//               body="Versioned drafts, anchored comments, and Grammarly-style AI feedback on every personal statement and supplement."
//             />
//             <FeatureCard
//               icon={ClipboardCheck}
//               title="Recommendation tracking"
//               body="Know exactly which recommenders have been asked, which have submitted, and which need a gentle nudge."
//             />
//             <FeatureCard
//               icon={CalendarDays}
//               title="Application timeline"
//               body="Deadline radar across the entire caseload — never let a Nov 1, Jan 1, or rolling deadline slip again."
//             />
//             <FeatureCard
//               icon={UserCheck}
//               title="Interview preparation"
//               body="Schedule mocks, track alumni interviews, and keep notes on every prep session in the student record."
//             />
//             <FeatureCard
//               icon={School}
//               title="Student & parent portal"
//               body="A calm shared workspace for the student — and clean parent communication that keeps families in the loop."
//             />
//             <FeatureCard
//               icon={Library}
//               title="University database"
//               body="Curated profiles for thousands of universities — UG, grad, MBA, and international — searchable from any student."
//             />
//             <FeatureCard
//               icon={FileText}
//               title="Engagement agreements"
//               body="Send branded, digitally-signed engagement agreements with package, hourly, edit, or MBA templates."
//             />
//             <FeatureCard
//               icon={Users2}
//               title="Team collaboration"
//               body="Multi-consultant firms can share students, assign work, and keep visibility across the whole team."
//             />
//             <FeatureCard
//               icon={FolderOpen}
//               title="Document management"
//               body="Transcripts, test scores, acceptance letters, agreements — every file lives on the student record."
//             />
//             <FeatureCard
//               icon={Bell}
//               title="Automated reminders"
//               body="Smart follow-ups for unpaid invoices, missing essays, upcoming deadlines, and stalled students."
//             />
//             <FeatureCard
//               icon={Mail}
//               title="Parent communication"
//               body="Centralized parent threads, update emails, and meeting recaps — without losing your inbox."
//             />
//             <FeatureCard
//               icon={BarChart3}
//               title="Practice analytics"
//               body="Revenue, conversion funnel, acceptance map, and source ROI — the metrics that actually move the practice."
//             />
//             <FeatureCard
//               icon={GraduationCap}
//               title="Alumni & outcomes"
//               body="A living record of where students were accepted, where they enrolled, and what they're doing now."
//             />
//           </div>
//         </div>
//       </section>

//       {/* Social proof / Founders */}
//       <section id="founders" className="border-t border-border/60 bg-gradient-to-br from-amber-50/70 via-background to-rose-50/60">
//         <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24">
//           <div className="grid md:grid-cols-2 gap-12 items-start">
//             <div>
//               <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-xs font-medium mb-5">
//                 Built by admissions consultants
//               </div>

//             <h2
//               className="text-3xl md:text-4xl font-bold tracking-tight"
//               style={{ fontFamily: "Sora, Inter, sans-serif" }}
//             >
//               Why trust us to build software for your practice?
//             </h2>
//             <p className="mt-5 text-muted-foreground leading-relaxed">
//               After years leading one of the leading UK and U.S.-focused
//               admissions consultancies and helping thousands of students
//               navigate competitive admissions processes, we realized that no
//               CRM truly reflected how admissions consultants work.
//             </p>
//             <p className="mt-4 text-muted-foreground leading-relaxed">
//               Primrose was built to solve that problem — by the people who
//               live the workflow every day.
//             </p>
//             <div className="mt-8 grid grid-cols-2 gap-4">
//               <Stat number="1000s" label="Applicants supported" />
//               <Stat number="15+" label="Years of practice" />
//               <Stat number="UG · Grad · MBA" label="All applicant types" />
//               <Stat number="UK · US · Global" label="Cross-border expertise" />
//             </div>
//           </div>
//           <div className="space-y-4">
//             <Testimonial
//               quote="Primrose finally replaced the four tools I was juggling. The AI assistant alone saves me hours a week."
//               name="Beta consultant, US"
//               role="Solo consultant, undergraduate admissions"
//             />
//             <Testimonial
//               quote="It's the first platform that actually thinks like an admissions consultant. The essay workflow is a game-changer."
//               name="Beta consultant, UK"
//               role="Boutique firm, UG + MBA"
//             />
//             <Testimonial
//               quote="The college list, deadline tracking, and parent communication finally live in one place. My students feel it too."
//               name="Beta consultant, International"
//               role="Cross-border advisor"
//             />
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Pricing */}
//       <section id="pricing" className="border-t border-border/60 bg-gradient-to-br from-emerald-50/70 via-background to-sky-50/60">

//         <div className="mx-auto max-w-3xl px-4 sm:px-6 py-14 sm:py-20 text-center">
//           <h2
//             className="text-3xl md:text-4xl font-bold tracking-tight"
//             style={{ fontFamily: "Sora, Inter, sans-serif" }}
//           >
//             Founding consultant pricing
//           </h2>
//           <p className="mt-4 text-muted-foreground leading-relaxed">
//             Early access consultants receive preferred lifetime pricing,
//             white-glove onboarding, and direct input into the product roadmap.
//             Spots in the Founding Consultant Program are limited.
//           </p>
//           <div className="mt-8 rounded-2xl border border-primary/30 bg-card p-8 text-left shadow-lg">
//             <div className="flex items-center justify-between flex-wrap gap-3">
//               <div>
//                 <div className="text-xs uppercase tracking-wide text-primary font-medium">Founding Consultant</div>
//                 <div className="text-2xl font-bold mt-1">Preferred lifetime rate</div>
//               </div>
//               <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium">
//                 Limited beta spots
//               </div>
//             </div>
//             <ul className="mt-6 space-y-2.5 text-sm">
//               {[
//                 "Full access to every Primrose feature",
//                 "Lifetime discount locked in at the founding rate",
//                 "Personal onboarding and data migration",
//                 "Direct line to the product team",
//                 "Early access to new AI features",
//               ].map((line) => (
//                 <li key={line} className="flex items-start gap-2">
//                   <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
//                   <span className="text-muted-foreground">{line}</span>
//                 </li>
//               ))}
//             </ul>
//           </div>
//         </div>
//       </section>

//       {/* Final CTA */}
//       <section id="cta" className="relative overflow-hidden border-t border-border/60 bg-gradient-to-br from-violet-600 via-rose-500 to-amber-500 text-white">
//         <div className="pointer-events-none absolute inset-0 -z-0 opacity-30">
//           <div className="absolute -top-20 left-10 h-72 w-72 rounded-full bg-white/30 blur-3xl" />
//           <div className="absolute bottom-0 right-10 h-80 w-80 rounded-full bg-amber-200/40 blur-3xl" />
//         </div>
//         <div className="relative mx-auto max-w-3xl px-4 sm:px-6 py-16 sm:py-24 text-center">
//           <h2
//             className="text-3xl md:text-5xl font-bold tracking-tight"
//             style={{ fontFamily: "Sora, Inter, sans-serif" }}
//           >
//             Run your admissions practice on Primrose
//           </h2>
//           <p className="mt-5 text-white/90 text-lg">
//             Join the Founding Consultant Program and help shape the operating
//             system for modern admissions consulting.
//           </p>
//           <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
//             <Link to="/dashboard">
//               <Button size="lg" className="gap-2 bg-white text-violet-700 hover:bg-white/90 border-0 shadow-lg">
//                 Request early access <ArrowRight className="h-4 w-4" />
//               </Button>
//             </Link>
//             <a href="mailto:hello@primrose-iec.com">
//               <Button size="lg" variant="outline" className="border-white/70 text-white bg-white/10 hover:bg-white/20 hover:text-white">Book a demo</Button>
//             </a>
//           </div>
//         </div>
//       </section>


//       <footer className="border-t border-border/60">
//         <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
//           <div className="flex items-center gap-2">
//             <GraduationCap className="h-4 w-4" />
//             <span>© {new Date().getFullYear()} Primrose — The admissions practice operating system</span>
//           </div>
//           <div className="flex items-center gap-6">
//             <a href="#features" className="hover:text-foreground">Features</a>
//             <a href="#pricing" className="hover:text-foreground">Pricing</a>
//             <a href="#cta" className="hover:text-foreground">Early access</a>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// }

// const FEATURE_ACCENTS = [
//   "bg-violet-100 text-violet-600 group-hover:bg-violet-200",
//   "bg-rose-100 text-rose-600 group-hover:bg-rose-200",
//   "bg-amber-100 text-amber-700 group-hover:bg-amber-200",
//   "bg-sky-100 text-sky-600 group-hover:bg-sky-200",
//   "bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200",
//   "bg-fuchsia-100 text-fuchsia-600 group-hover:bg-fuchsia-200",
//   "bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200",
//   "bg-teal-100 text-teal-600 group-hover:bg-teal-200",
// ];

// let __featureIdx = 0;

// function FeatureCard({
//   icon: Icon,
//   title,
//   body,
// }: {
//   icon: React.ComponentType<{ className?: string }>;
//   title: string;
//   body: string;
// }) {
//   const accent = FEATURE_ACCENTS[__featureIdx++ % FEATURE_ACCENTS.length];
//   return (
//     <div className="group rounded-2xl border border-border/70 bg-white p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all">
//       <div className={`h-10 w-10 rounded-lg flex items-center justify-center mb-4 transition-colors ${accent}`}>
//         <Icon className="h-5 w-5" />
//       </div>
//       <h3 className="font-semibold text-base">{title}</h3>
//       <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
//     </div>
//   );
// }


// function Stat({ number, label }: { number: string; label: string }) {
//   return (
//     <div className="rounded-xl border border-border bg-card p-4">
//       <div className="text-xl font-bold tracking-tight">{number}</div>
//       <div className="text-xs text-muted-foreground mt-1">{label}</div>
//     </div>
//   );
// }

// function Testimonial({
//   quote,
//   name,
//   role,
// }: {
//   quote: string;
//   name: string;
//   role: string;
// }) {
//   return (
//     <div className="rounded-2xl border border-border bg-card p-6">
//       <Quote className="h-5 w-5 text-primary/50 mb-3" />
//       <p className="text-sm leading-relaxed text-foreground">"{quote}"</p>
//       <div className="mt-4 text-xs">
//         <div className="font-medium">{name}</div>
//         <div className="text-muted-foreground">{role}</div>
//       </div>
//     </div>
//   );
// }

// type AiAnswer = {
//   question: string;
//   headline: string;
//   rows: { name: string; meta: string }[];
//   cta: string;
// };

// const AI_ANSWERS: AiAnswer[] = [
//   {
//     question: "Which seniors haven't started their Common App personal statement?",
//     headline: "3 seniors have no draft started:",
//     rows: [
//       { name: "Maya Chen", meta: "last met 6 days ago" },
//       { name: "Jordan Patel", meta: "Common App opens in 4 days" },
//       { name: "Sam Rivera", meta: "last met 12 days ago" },
//     ],
//     cta: "→ Open all three students",
//   },
//   {
//     question: "Which students are missing recommendation letters?",
//     headline: "4 students still need at least one rec letter:",
//     rows: [
//       { name: "Aiden Walker", meta: "2 of 3 letters received" },
//       { name: "Priya Shah", meta: "0 of 2 letters received" },
//       { name: "Liam O'Connor", meta: "1 of 3 letters received" },
//       { name: "Noor Haddad", meta: "1 of 2 letters received" },
//     ],
//     cta: "→ Email recommenders",
//   },
//   {
//     question: "Which seniors haven't started their supplemental essays?",
//     headline: "5 seniors have no supplement drafts yet:",
//     rows: [
//       { name: "Ethan Park", meta: "UPenn supplement due Nov 1" },
//       { name: "Sofia Alvarez", meta: "USC supplement due Nov 1" },
//       { name: "Marcus Bell", meta: "Northwestern Why Us due Jan 1" },
//       { name: "Hannah Goldberg", meta: "Yale 3 supplements outstanding" },
//     ],
//     cta: "→ Send writing nudge",
//   },
//   {
//     question: "Which applications are due in the next 14 days?",
//     headline: "12 applications across 7 students:",
//     rows: [
//       { name: "Stanford REA", meta: "Nov 1 · 3 students" },
//       { name: "Georgetown EA", meta: "Nov 1 · 2 students" },
//       { name: "UNC Chapel Hill EA", meta: "Oct 15 · 4 students" },
//       { name: "MIT EA", meta: "Nov 1 · 3 students" },
//     ],
//     cta: "→ Open deadline radar",
//   },
//   {
//     question: "Which families have an outstanding balance?",
//     headline: "3 families with overdue invoices ($14,500 total):",
//     rows: [
//       { name: "The Chen family", meta: "$6,000 · 22 days overdue" },
//       { name: "The Patel family", meta: "$5,500 · 9 days overdue" },
//       { name: "The Rivera family", meta: "$3,000 · 4 days overdue" },
//     ],
//     cta: "→ Send payment reminders",
//   },
//   {
//     question: "Where did last year's cohort get accepted?",
//     headline: "Class of 2025 — 28 students, 142 acceptances:",
//     rows: [
//       { name: "Ivy + Stanford + MIT", meta: "9 acceptances" },
//       { name: "Top-20 US universities", meta: "47 acceptances" },
//       { name: "Oxbridge + UK G5", meta: "12 acceptances" },
//       { name: "Top US liberal arts colleges", meta: "18 acceptances" },
//     ],
//     cta: "→ Open outcomes report",
//   },
// ];

// function AiShowcase() {
//   const [activeIdx, setActiveIdx] = useState(0);
//   const [typed, setTyped] = useState("");
//   const [showAnswer, setShowAnswer] = useState(false);
//   const answer = AI_ANSWERS[activeIdx];

//   // Typewriter + auto-advance loop
//   useEffect(() => {
//     setTyped("");
//     setShowAnswer(false);
//     const full = answer.question;
//     let i = 0;
//     let revealTimer: ReturnType<typeof setTimeout> | undefined;
//     let advanceTimer: ReturnType<typeof setTimeout> | undefined;
//     const typeTimer = setInterval(() => {
//       i += 1;
//       setTyped(full.slice(0, i));
//       if (i >= full.length) {
//         clearInterval(typeTimer);
//         revealTimer = setTimeout(() => setShowAnswer(true), 350);
//         advanceTimer = setTimeout(() => {
//           setActiveIdx((idx) => (idx + 1) % AI_ANSWERS.length);
//         }, 4200);
//       }
//     }, 38);
//     return () => {
//       clearInterval(typeTimer);
//       if (revealTimer) clearTimeout(revealTimer);
//       if (advanceTimer) clearTimeout(advanceTimer);
//     };
//   }, [activeIdx, answer.question]);


//   return (
//     <section id="ai" className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24">
//       <div className="grid md:grid-cols-2 gap-12 items-start">
//         <div>
//           <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium mb-5">
//             <Sparkles className="h-3.5 w-3.5" /> Core to the platform
//           </div>
//           <h2
//             className="text-3xl md:text-4xl font-bold tracking-tight"
//             style={{ fontFamily: "Sora, Inter, sans-serif" }}
//           >
//             Your AI admissions operations assistant
//           </h2>
//           <p className="mt-4 text-muted-foreground leading-relaxed">
//             Ask Primrose anything about your practice in plain English. No
//             filters to build, no reports to configure — your entire caseload,
//             instantly queryable.
//           </p>
//           <p className="mt-6 text-xs uppercase tracking-wide text-muted-foreground font-medium">
//             Questions consultants ask Primrose
//           </p>
//           <ul className="mt-3 space-y-2 text-sm">
//             {AI_ANSWERS.map((a, i) => {
//               const isActive = i === activeIdx;
//               return (
//                 <li
//                   key={a.question}
//                   className={
//                     "flex items-start gap-3 rounded-lg px-3 py-2 border transition-colors " +
//                     (isActive
//                       ? "bg-primary/5 border-primary/30 text-foreground"
//                       : "border-transparent text-muted-foreground")
//                   }
//                 >
//                   <MessageSquare
//                     className={
//                       "h-4 w-4 mt-0.5 flex-shrink-0 " +
//                       (isActive ? "text-primary" : "text-muted-foreground")
//                     }
//                   />
//                   <span className="italic">"{a.question}"</span>
//                 </li>
//               );
//             })}
//           </ul>
//           <p className="mt-6 text-sm text-foreground font-medium">
//             Plus AI-powered essay review for line edits, structural feedback,
//             and voice notes — sent straight to your student as inline comments.
//           </p>
//         </div>
//         <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-xl md:sticky md:top-24">
//           <div className="flex items-start gap-3">
//             <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
//               <Sparkles className="h-4 w-4" />
//             </div>
//             <div className="flex-1 space-y-3 min-w-0">
//               <div className="rounded-xl bg-muted/60 p-3 text-sm min-h-[3.5rem]">
//                 {typed}
//                 <span
//                   className="inline-block w-[2px] h-4 align-middle bg-foreground/70 ml-0.5 animate-pulse"
//                   aria-hidden
//                 />
//               </div>
//               {showAnswer && (
//                 <div
//                   key={activeIdx}
//                   className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-sm space-y-2 animate-fade-in"
//                 >
//                   <div className="font-medium">{answer.headline}</div>
//                   <ul className="space-y-1.5 text-muted-foreground">
//                     {answer.rows.map((r) => (
//                       <li key={r.name} className="flex items-center gap-2">
//                         <UserCheck className="h-3.5 w-3.5 flex-shrink-0" />
//                         <span>
//                           <span className="text-foreground">{r.name}</span>
//                           <span className="mx-1">—</span>
//                           {r.meta}
//                         </span>
//                       </li>
//                     ))}
//                   </ul>
//                   <div className="pt-2 text-xs text-primary">{answer.cta}</div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }


import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
// import nacacLogo from "@/assets/logos/nacac.png.asset.json";
// import iecaLogo from "@/assets/logos/ieca.png.asset.json";
// import hecaLogo from "@/assets/logos/heca.png.asset.json";
// import internationalAcacLogo from "@/assets/logos/international-acac.png.asset.json";


import {
  GraduationCap,
  Users,
  ListChecks,
  FileText,
  BarChart3,
  Sparkles,
  ArrowRight,
  Star,
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
  Menu,
  X,
  Search,
  LayoutDashboard,
  DollarSign,
  Clock,
  Calculator,
  PenLine,
  StickyNote,
  CheckSquare,
  Send,
  Paperclip,
  Sigma,
  Lock,
  ShieldCheck,
} from "lucide-react";



/** Scroll-triggered fade/slide-up wrapper. */
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.classList.add("is-visible");
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}


export default function Landing() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
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
              Primrose
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#why" className="hover:text-foreground transition">Why Primrose</a>
            <a href="#demo" className="hover:text-foreground transition">Demo</a>
            <a href="#ai" className="hover:text-foreground transition">AI</a>
            <a href="#features" className="hover:text-foreground transition">Features</a>
            <a href="#founders" className="hover:text-foreground transition">Founders</a>
            <a href="#pricing" className="hover:text-foreground transition">Pricing</a>
            <a href="#faq" className="hover:text-foreground transition">FAQ</a>
          </nav>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to="/sign-in" className="hidden sm:inline-flex text-sm text-muted-foreground hover:text-foreground transition px-2">
              Sign in
            </Link>
            <a href="#cta" className="hidden sm:inline-flex">
              <Button size="sm" className="text-xs sm:text-sm px-3 sm:px-4">Early access</Button>
            </a>
            <button
              type="button"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border/60 text-foreground"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur">
            <nav className="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-1 text-sm">
              {[
                { href: "#why", label: "Why Primrose" },
                { href: "#demo", label: "Demo" },
                { href: "#ai", label: "AI" },
                { href: "#features", label: "Features" },
                { href: "#founders", label: "Founders" },
                { href: "#pricing", label: "Pricing" },
                { href: "#faq", label: "FAQ" },
              ].map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="py-2 px-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60"
                >
                  {l.label}
                </a>
              ))}
              <Link
                to="/sign-in"
                onClick={() => setMobileOpen(false)}
                className="py-2 px-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60"
              >
                Sign in
              </Link>
              <a href="#cta" onClick={() => setMobileOpen(false)} className="mt-1">
                <Button size="sm" className="w-full">Early access</Button>
              </a>
            </nav>
          </div>
        )}
      </header>



      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Colorful gradient blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-32 -left-24 h-[520px] w-[520px] rounded-full bg-violet-400/60 blur-[110px] animate-float-slow" />
          <div className="absolute -top-10 -right-16 h-[460px] w-[460px] rounded-full bg-amber-300/70 blur-[110px] animate-float-slower" />
          <div className="absolute top-48 left-1/3 h-[380px] w-[380px] rounded-full bg-rose-400/55 blur-[110px] animate-drift-x" />
          <div className="absolute -bottom-10 right-1/4 h-[420px] w-[420px] rounded-full bg-sky-400/55 blur-[110px] animate-float-slow" />
          <div className="absolute top-1/3 -left-10 h-[300px] w-[300px] rounded-full bg-emerald-300/50 blur-[100px] animate-float-slower" />
        </div>

        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-12 sm:pt-20 pb-16 sm:pb-24 text-center">
          <Reveal className="inline-flex items-center gap-2 rounded-full border border-violet-300/60 bg-white/70 backdrop-blur px-3 py-1 text-[11px] sm:text-xs font-medium text-violet-700 mb-3 sm:mb-4 shadow-sm animate-badge-bob">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">The admissions practice operating system</span>
            <span className="sm:hidden">Admissions practice OS</span>
          </Reveal>
          <Reveal delay={40} className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-white/80 backdrop-blur px-3.5 py-1.5 text-[11px] sm:text-xs font-medium shadow-sm mb-5 sm:mb-6">
            <span className="text-foreground">Excellent</span>
            <span className="font-bold text-foreground">4.8</span>
            <span className="flex items-center gap-0.5">
              {[...Array(4)].map((_, i) => (
                <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
              ))}
              <Star className="h-3 w-3 text-amber-200/80" />
            </span>
            <span className="text-muted-foreground">3,079 reviews</span>
          </Reveal>
          <Reveal delay={80}>
            <h1
              className="text-[2rem] leading-[1.1] sm:text-5xl md:text-6xl font-bold tracking-tight sm:leading-[1.05] max-w-4xl mx-auto"
              style={{ fontFamily: "Sora, Inter, system-ui, sans-serif" }}
            >
              The{" "}
              <span className="bg-gradient-to-r from-violet-600 via-rose-500 to-amber-500 bg-clip-text text-transparent animate-gradient-x">
                AI-powered operating system
              </span>{" "}
              for independent educational consultants
            </h1>
          </Reveal>
          <Reveal delay={180}>
            <p className="mt-5 sm:mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed px-2">
              Manage leads, students, essays, deadlines, agreements, payments, and
              outcomes in one calm workspace built specifically for admissions
              consulting.
            </p>
          </Reveal>
          <Reveal delay={260}>
            <div className="mt-8 sm:mt-10 flex items-center justify-center gap-3 flex-wrap">
              <a href="#cta" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto gap-2 bg-gradient-to-r from-violet-600 to-rose-500 hover:from-violet-700 hover:to-rose-600 text-white border-0 shadow-lg shadow-violet-500/20 transition-transform hover:scale-[1.03]">
                  Request early access <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
              <a href="#demo" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-violet-300 text-violet-700 hover:bg-violet-50">See Primrose in action</Button>
              </a>
            </div>
          </Reveal>
          <p className="mt-4 text-xs text-muted-foreground">
            Built by admissions consultants for admissions consultants.
          </p>
        </div>
      </section>

      {/* Trust bar */}
      {/* <section className="border-y border-border/60 bg-background">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10 text-center">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-6">
            Used by consultants from leading admissions organizations
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-8 gap-y-5">
            <OrganizationBadge logo={nacacLogo.url} name="National Association for College Admission Counseling" />
            <OrganizationBadge logo={iecaLogo.url} name="Independent Educational Consultants Association" />
            <OrganizationBadge logo={hecaLogo.url} name="Higher Education Consultants Association" />
            <OrganizationBadge logo={internationalAcacLogo.url} name="International Association for College Admission Counseling" />
          </div>
        </div>
      </section> */}




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
            Most admissions consultants run their practice on a patchwork of
            spreadsheets, Google Docs, email threads, shared calendars, and
            generic CRMs that were designed for sales teams — not for guiding a
            student through four years of essays, applications, and decisions.
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
            ].map((row, i) => (
              <Reveal key={row.before} delay={i * 120} className="h-full">
                <div className="h-full rounded-xl border border-violet-200/70 bg-white shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
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
              </Reveal>
            ))}
          </div>

        </div>
      </section>

      {/* Platform preview / Demo */}
      <section id="demo" className="border-t border-border/60 bg-gradient-to-br from-violet-50/80 via-background to-sky-50/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-20">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 text-violet-700 px-3 py-1 text-xs font-medium mb-5">
              Product preview
            </div>
            <h2
              className="text-3xl md:text-4xl font-bold tracking-tight"
              style={{ fontFamily: "Sora, Inter, sans-serif" }}
            >
              Your entire practice, calm and organized
            </h2>
            <p className="mt-4 text-muted-foreground">
              A unified dashboard where inquiries, students, deadlines, documents, and outcomes live together.
            </p>
          </div>
          <Reveal>
            <div className="rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60 bg-muted/50">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-rose-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
                <div className="ml-4 flex-1 max-w-md rounded-md bg-background border border-border/60 px-3 py-1 text-xs text-muted-foreground flex items-center gap-2">
                  <Search className="h-3 w-3" /> app.primrose-iec.com/dashboard
                </div>
              </div>
              {/* App body */}
              <div className="flex min-h-[340px] sm:min-h-[440px]">
                {/* Sidebar */}
                <div className="hidden sm:flex w-52 flex-col border-r border-border/60 bg-muted/30 p-4 gap-2">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-7 w-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                      <GraduationCap className="h-4 w-4" />
                    </div>
                    <span className="font-semibold text-sm">Primrose</span>
                  </div>
                  {[
                    { icon: LayoutDashboard, label: "Dashboard", active: true },
                    { icon: Users, label: "Inquiries" },
                    { icon: School, label: "Students" },
                    { icon: FileText, label: "Essays" },
                    { icon: CalendarDays, label: "Deadlines" },
                    { icon: BarChart3, label: "Analytics" },
                    { icon: FolderOpen, label: "Files" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition ${
                        item.active
                          ? "bg-primary/10 text-foreground font-medium"
                          : "text-muted-foreground hover:bg-muted/60"
                      }`}
                    >
                      <item.icon className="h-3.5 w-3.5" />
                      {item.label}
                    </div>
                  ))}
                </div>
                {/* Main dashboard */}
                <div className="flex-1 p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="font-semibold">Dashboard</h3>
                      <p className="text-xs text-muted-foreground">Welcome back — here's your practice today</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full border border-border/70 flex items-center justify-center">
                        <Bell className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="h-8 w-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-semibold">
                        JD
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                    {[
                      { label: "Active students", value: "28", icon: Users },
                      { label: "Open inquiries", value: "12", icon: MessageSquare },
                      { label: "Due this week", value: "7", icon: Clock },
                      { label: "Revenue YTD", value: "$142K", icon: DollarSign },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-xl border border-border/70 bg-background p-3">
                        <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                          <stat.icon className="h-3.5 w-3.5" />
                          <span className="text-[10px] uppercase tracking-wide font-medium">{stat.label}</span>
                        </div>
                        <div className="text-xl font-bold">{stat.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 rounded-xl border border-border/70 bg-background p-4">
                      <div className="text-xs font-medium mb-3">Acceptance outcomes</div>
                      <div className="flex items-end gap-2 h-28">
                        {[40, 65, 45, 80, 55, 70, 90].map((h, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-t-md bg-gradient-to-t from-violet-500 to-violet-300"
                            style={{ height: `${h}%` }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-background p-4">
                      <div className="text-xs font-medium mb-3">Attention needed</div>
                      <div className="space-y-2">
                        {[
                          "Maya Chen — missing rec letter",
                          "Jordan Patel — essay due Oct 15",
                          "Sam Rivera — payment overdue",
                        ].map((item) => (
                          <div key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
          <div className="mt-8 sm:mt-10 text-center">
            <a href="#cta">
              <Button className="gap-2 bg-gradient-to-r from-violet-600 to-rose-500 hover:from-violet-700 hover:to-rose-600 text-white border-0 shadow-lg shadow-violet-500/20">
                Request early access <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Student portal preview */}
      <section id="student-demo" className="border-t border-border/60 bg-gradient-to-br from-emerald-50/70 via-background to-sky-50/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-20">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-xs font-medium mb-5">
              Student portal
            </div>
            <h2
              className="text-3xl md:text-4xl font-bold tracking-tight"
              style={{ fontFamily: "Sora, Inter, sans-serif" }}
            >
              A focused workspace for every student
            </h2>
            <p className="mt-4 text-muted-foreground">
              Students share drafts, receive feedback, and track every version — with deadlines, tasks, and notes in one calm workspace.
            </p>
          </div>
          <Reveal>
            <div className="rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60 bg-muted/50">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-rose-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
                <div className="ml-4 flex-1 max-w-md rounded-md bg-background border border-border/60 px-3 py-1 text-xs text-muted-foreground flex items-center gap-2">
                  <Search className="h-3 w-3" /> app.primrose-iec.com/student
                </div>
              </div>
              <div className="flex min-h-[340px] sm:min-h-[560px]">
                <div className="hidden sm:flex w-52 flex-col border-r border-border/60 bg-muted/30 p-4 gap-1">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-7 w-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                      <GraduationCap className="h-4 w-4" />
                    </div>
                    <span className="font-semibold text-sm">Primrose</span>
                  </div>
                  {[
                    { icon: LayoutDashboard, label: "Dashboard", active: true },
                    { icon: PenLine, label: "Essays" },
                    { icon: Mail, label: "Correspondence" },
                    { icon: Calculator, label: "Tuition calculator" },
                    { icon: CheckSquare, label: "Tasks" },
                    { icon: CalendarDays, label: "Calendar" },
                    { icon: StickyNote, label: "Notes" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition ${
                        item.active
                          ? "bg-emerald-600/10 text-foreground font-medium"
                          : "text-muted-foreground hover:bg-muted/60"
                      }`}
                    >
                      <item.icon className="h-3.5 w-3.5" />
                      {item.label}
                    </div>
                  ))}
                </div>
                <div className="flex-1 p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="font-semibold">Welcome back, Maya</h3>
                      <p className="text-xs text-muted-foreground">Fall 2026 cycle · 47 days to next deadline</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full border border-border/70 flex items-center justify-center">
                        <Bell className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-semibold">
                        MC
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div className="md:col-span-2 rounded-xl border border-border/70 bg-background overflow-hidden flex flex-col">
                      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-muted/30">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-emerald-600" />
                          <span className="text-xs font-medium">Document exchange</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">Common App · Personal statement</span>
                        </div>
                      </div>
                      <div className="p-4 space-y-4 flex-1">
                        {[
                          {
                            avatar: "MC",
                            author: "Maya Chen",
                            time: "Oct 12, 9:14 PM",
                            action: "Submitted draft v1",
                            file: { name: "personal-statement-v1.docx", meta: "12 KB · 3 pages", status: "Submitted", tone: "bg-sky-100 text-sky-700" },
                          },
                          {
                            avatar: "JD",
                            author: "Jane Doe · Consultant",
                            time: "Oct 13, 10:02 AM",
                            action: "Left feedback on draft v1",
                            comment: "Strong opening. Tighten the pivot in paragraph 3 and add a more specific moment in the conclusion. See comments in the doc.",
                          },
                          {
                            avatar: "MC",
                            author: "Maya Chen",
                            time: "Oct 14, 3:45 PM",
                            action: "Submitted draft v2",
                            file: { name: "personal-statement-v2.docx", meta: "13 KB · 3 pages", status: "In review", tone: "bg-amber-100 text-amber-700" },
                          },
                          {
                            avatar: "JD",
                            author: "Jane Doe · Consultant",
                            time: "Oct 14, 6:20 PM",
                            action: "Reviewed and approved draft v2",
                            comment: "Much stronger arc. Ready to finalize for the Common App.",
                            approved: true,
                          },
                        ].map((item, i) => (
                          <div key={i} className="flex gap-3">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${item.author.includes("Maya") ? "bg-emerald-100 text-emerald-700" : "bg-violet-100 text-violet-700"}`}>
                              {item.avatar}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2 mb-0.5">
                                <span className="text-xs font-medium">{item.author}</span>
                                <span className="text-[10px] text-muted-foreground">{item.time}</span>
                              </div>
                              <div className="text-[11px] text-muted-foreground mb-1.5">{item.action}</div>
                              {item.file && (
                                <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/30 px-3 py-2">
                                  <div className="h-8 w-8 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                    <FileText className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-xs font-medium truncate">{item.file.name}</div>
                                    <div className="text-[10px] text-muted-foreground">{item.file.meta}</div>
                                  </div>
                                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-medium ${item.file.tone}`}>
                                    {item.file.status}
                                  </span>
                                </div>
                              )}
                              {item.comment && (
                                <div className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-[11px] text-foreground/90">
                                  {item.comment}
                                  {item.approved && <span className="ml-1 inline-flex items-center text-emerald-600"><CheckCircle2 className="h-3 w-3 ml-1" /></span>}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="px-3 py-2 border-t border-border/60 flex items-center gap-2">
                        <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                        <div className="flex-1 rounded-md bg-muted/40 px-2.5 py-1.5 text-[11px] text-muted-foreground">
                          Drop a new draft or send a note to your consultant…
                        </div>
                        <div className="h-7 w-7 rounded-md bg-emerald-600 text-white flex items-center justify-center">
                          <Send className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/70 bg-background p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Calculator className="h-4 w-4 text-emerald-600" />
                        <span className="text-xs font-medium">Tuition calculator</span>
                      </div>
                      <div className="space-y-2 text-[11px]">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Tuition & fees</span>
                          <span className="text-foreground font-medium">$64,200</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Room & board</span>
                          <span className="text-foreground font-medium">$17,800</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Est. aid</span>
                          <span className="text-emerald-600 font-medium">−$28,500</span>
                        </div>
                        <div className="border-t border-border/60 my-2" />
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-1 font-medium"><Sigma className="h-3 w-3" /> Net cost</span>
                          <span className="text-base font-bold">$53,500</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">/ year · Brown University</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-border/70 bg-background p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <PenLine className="h-4 w-4 text-violet-600" />
                          <span className="text-xs font-medium">Essay exchange</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">3 drafts</span>
                      </div>
                      <div className="space-y-2">
                        {[
                          { title: "Common App personal", status: "Reviewed", tone: "bg-emerald-100 text-emerald-700" },
                          { title: "Brown · Why us", status: "In review", tone: "bg-amber-100 text-amber-700" },
                          { title: "Yale · Community", status: "Draft", tone: "bg-muted text-muted-foreground" },
                        ].map((e) => (
                          <div key={e.title} className="flex items-center justify-between text-[11px]">
                            <span className="truncate pr-2">{e.title}</span>
                            <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${e.tone}`}>{e.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/70 bg-background p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-sky-600" />
                          <span className="text-xs font-medium">Resume & correspondence</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">2 new</span>
                      </div>
                      <div className="space-y-2.5">
                        {[
                          { from: "Coach Daniels", subj: "Recommendation sent", time: "2h" },
                          { from: "Brown Admissions", subj: "Interview invitation", time: "1d" },
                          { from: "Mr. Alvarez", subj: "Resume v3 feedback", time: "3d" },
                        ].map((m) => (
                          <div key={m.subj} className="flex items-start gap-2">
                            <div className="h-6 w-6 rounded-full bg-muted text-[9px] font-semibold flex items-center justify-center text-muted-foreground shrink-0">
                              {m.from.split(" ").map(w=>w[0]).join("").slice(0,2)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] font-medium truncate">{m.from}</span>
                                <span className="text-[9px] text-muted-foreground shrink-0">{m.time}</span>
                              </div>
                              <div className="text-[10px] text-muted-foreground truncate">{m.subj}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-xl border border-border/70 bg-background p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckSquare className="h-4 w-4 text-rose-500" />
                          <span className="text-xs font-medium">Tasks</span>
                        </div>
                        <div className="space-y-1.5">
                          {[
                            { t: "Request rec letter — Ms. Park", done: true },
                            { t: "Submit Brown supplement", done: false },
                            { t: "FAFSA — parent section", done: false },
                          ].map((task) => (
                            <div key={task.t} className="flex items-center gap-2 text-[11px]">
                              <div className={`h-3 w-3 rounded border flex items-center justify-center ${task.done ? "bg-emerald-600 border-emerald-600" : "border-border"}`}>
                                {task.done && <CheckCircle2 className="h-2.5 w-2.5 text-white" />}
                              </div>
                              <span className={task.done ? "line-through text-muted-foreground" : ""}>{task.t}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-xl border border-border/70 bg-amber-50/70 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <StickyNote className="h-4 w-4 text-amber-600" />
                          <span className="text-xs font-medium">Notes</span>
                        </div>
                        <p className="text-[11px] text-foreground/80 leading-relaxed">
                          Ask Ms. Park about the neuroscience research lab opening — could be a strong angle for the "Why Brown" supplement.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-border/70 bg-background p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-violet-600" />
                        <span className="text-xs font-medium">Upcoming · October</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">Week of Oct 14</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1.5">
                      {[
                        { d: "Mon", n: 14, label: "", tone: "" },
                        { d: "Tue", n: 15, label: "Essay due", tone: "bg-rose-100 text-rose-700" },
                        { d: "Wed", n: 16, label: "", tone: "" },
                        { d: "Thu", n: 17, label: "Advisor call", tone: "bg-violet-100 text-violet-700" },
                        { d: "Fri", n: 18, label: "", tone: "" },
                        { d: "Sat", n: 19, label: "SAT", tone: "bg-emerald-100 text-emerald-700" },
                        { d: "Sun", n: 20, label: "", tone: "" },
                      ].map((day) => (
                        <div key={day.n} className="rounded-md border border-border/60 p-1.5 min-h-[52px] flex flex-col">
                          <div className="text-[9px] uppercase text-muted-foreground">{day.d}</div>
                          <div className="text-xs font-semibold">{day.n}</div>
                          {day.label && (
                            <div className={`mt-auto rounded px-1 py-0.5 text-[9px] font-medium ${day.tone}`}>{day.label}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>






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

      {/* AI Essay Review */}
      <EssayReviewDemo />

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
              role="Solo consultant, undergraduate admissions"
            />
            <Testimonial
              quote="It's the first platform that actually thinks like an admissions consultant. The essay workflow is a game-changer."
              name="Beta consultant, UK"
              role="Boutique firm, UG + MBA"
            />
            <Testimonial
              quote="The college list, deadline tracking, and parent communication finally live in one place. My students feel it too."
              name="Beta consultant, International"
              role="Cross-border advisor"
            />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border/60 bg-gradient-to-br from-emerald-50/70 via-background to-sky-50/60">

        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-20">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium mb-5">
              Pricing
            </div>
            <h2
              className="text-3xl md:text-4xl font-bold tracking-tight"
              style={{ fontFamily: "Sora, Inter, sans-serif" }}
            >
              Simple pricing that scales with your practice
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Start free, upgrade when you're ready. Founding consultants lock in
              preferred lifetime pricing on any paid plan.
            </p>
            <div className="mt-8 inline-flex items-center rounded-full border border-border/60 bg-muted/60 p-1">
              <button
                type="button"
                onClick={() => setBilling("monthly")}
                className={`px-4 py-1.5 text-sm font-medium rounded-full transition ${
                  billing === "monthly"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBilling("annual")}
                className={`px-4 py-1.5 text-sm font-medium rounded-full transition ${
                  billing === "annual"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Annually
              </button>
            </div>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3 items-stretch">
            {[
              {
                name: "Starter",
                monthly: { price: "$0", cadence: "/ month", fullPrice: null, promo: null },
                annual: { price: "$0", cadence: "/ month", fullPrice: null, promo: "billed annually" },
                tagline: "For consultants exploring Primrose.",
                cta: "Start free",
                highlight: false,
                features: [
                  "Up to 5 active students",
                  "Inquiries, students & alumni pipeline",
                  "Document exchange & notes",
                  "Email support",
                ],
              },
              {
                name: "Professional",
                monthly: { price: "$19", cadence: "/ consultant / month", fullPrice: "$49", promo: "for the first month" },
                annual: { price: "$19", cadence: "/ consultant / month", fullPrice: "$49", promo: "billed annually" },
                tagline: "Everything a solo IEC needs to run a full practice.",
                cta: "Start 14-day trial",
                highlight: true,
                features: [
                  "Unlimited students & alumni",
                  "Digital engagement agreements",
                  "Tuition calculator & college list tracker",
                  "AI assistant & analytics dashboard",
                  "Student portal with essay exchange",
                ],
              },
              {
                name: "Team",
                monthly: { price: "$129", cadence: "/ consultant / month", fullPrice: null, promo: null },
                annual: { price: "$99", cadence: "/ consultant / month", fullPrice: "$129", promo: "billed annually" },
                tagline: "For multi-consultant firms and collaborations.",
                cta: "Talk to sales",
                highlight: false,
                features: [
                  "Everything in Professional",
                  "Multiple consultants & role management",
                  "Shared student assignments",
                  "Projects & collaboration revenue tracking",
                  "Priority onboarding & support",
                ],
              },
            ].map((tier) => {
              const plan = tier[billing];
              return (
                <div
                  key={tier.name}
                  className={`relative rounded-2xl border bg-card p-8 flex flex-col shadow-sm transition ${
                    tier.highlight
                      ? "border-primary/50 shadow-lg ring-1 ring-primary/20"
                      : "border-border/60"
                  }`}
                >
                  {tier.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-3 py-1 text-xs font-medium shadow">
                      Most popular
                    </div>
                  )}
                  <div className="text-xs uppercase tracking-wide text-primary font-medium">
                    {tier.name}
                  </div>
                  <div className="mt-3 flex items-baseline gap-1 flex-wrap">
                    {plan.fullPrice && (
                      <span className="text-lg text-muted-foreground line-through mr-1">
                        {plan.fullPrice}
                      </span>
                    )}
                    <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.cadence}</span>
                  </div>
                  {plan.promo && (
                    <p className="mt-1 text-xs font-medium text-primary">{plan.promo}</p>
                  )}
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                    {tier.tagline}
                  </p>
                  <ul className="mt-6 space-y-2.5 text-sm flex-1">
                    {tier.features.map((line) => (
                      <li key={line} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{line}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#cta"
                    className={`mt-8 inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                      tier.highlight
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "border border-border bg-background hover:bg-muted"
                    }`}
                  >
                    {tier.cta}
                  </a>
                </div>
              );
            })}
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Professional is $19 for the first month, then $49/month. Prices in USD, billed monthly or annually.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border/60 bg-gradient-to-br from-violet-50/70 via-background to-emerald-50/60">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16 sm:py-24">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-xs font-medium mb-5">
              <ShieldCheck className="h-3.5 w-3.5" />
              Your data is safe
            </div>
            <h2
              className="text-3xl md:text-4xl font-bold tracking-tight"
              style={{ fontFamily: "Sora, Inter, sans-serif" }}
            >
              Frequently asked questions
            </h2>
            <p className="mt-4 text-muted-foreground">
              Everything you need to know about Primrose, security, and how we keep your practice data private.
            </p>
          </div>

          <div className="mt-10 rounded-2xl border border-border/70 bg-card p-2 sm:p-6 shadow-sm">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="faq-1" className="last:border-b-0">
                <AccordionTrigger className="text-left text-sm sm:text-base px-2">
                  What is Primrose?
                </AccordionTrigger>
                <AccordionContent className="px-2 text-sm text-muted-foreground leading-relaxed">
                  Primrose is the admissions practice operating system for independent educational consultants. It brings inquiries, students, essays, deadlines, agreements, payments, and analytics into one calm workspace.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-2" className="last:border-b-0">
                <AccordionTrigger className="text-left text-sm sm:text-base px-2">
                  Is my student data safe?
                </AccordionTrigger>
                <AccordionContent className="px-2 text-sm text-muted-foreground leading-relaxed">
                  Yes. Security and privacy are built in from the ground up:
                  <ul className="mt-3 space-y-2">
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" /><span>Encrypted in transit and at rest</span></li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" /><span>Role-based access controls for your team</span></li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" /><span>We never sell your data or use it to train AI models</span></li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" /><span>Privacy-first defaults on every account</span></li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-3" className="last:border-b-0">
                <AccordionTrigger className="text-left text-sm sm:text-base px-2">
                  Can I try Primrose before committing?
                </AccordionTrigger>
                <AccordionContent className="px-2 text-sm text-muted-foreground leading-relaxed">
                  Yes. The Founding Consultant Program includes early access, personal onboarding, and data migration support. Book a demo or request early access and we’ll walk you through the platform.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-4" className="last:border-b-0">
                <AccordionTrigger className="text-left text-sm sm:text-base px-2">
                  Does Primrose work for solo consultants and teams?
                </AccordionTrigger>
                <AccordionContent className="px-2 text-sm text-muted-foreground leading-relaxed">
                  Both. Solo consultants get a calm, all-in-one workspace. Multi-consultant firms can share students, assign advisors, and manage permissions across the entire team.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-5" className="last:border-b-0">
                <AccordionTrigger className="text-left text-sm sm:text-base px-2">
                  What kind of support do I get?
                </AccordionTrigger>
                <AccordionContent className="px-2 text-sm text-muted-foreground leading-relaxed">
                  Founding consultants receive white-glove onboarding, migration help, and a direct line to the product team. We also provide help documentation and in-app guidance.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-6" className="last:border-b-0">
                <AccordionTrigger className="text-left text-sm sm:text-base px-2">
                  Is there a portal for students too?
                </AccordionTrigger>
                <AccordionContent className="px-2 text-sm text-muted-foreground leading-relaxed">
                  Yes. Students get a shared workspace to exchange essay drafts, view tasks, track deadlines, and calculate tuition — keeping families informed without the inbox chaos.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="mt-10 flex flex-col items-center text-center">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center shadow-lg mb-3">
              <Lock className="h-7 w-7" />
            </div>
            <p className="text-base font-semibold">Your data is encrypted and protected.</p>
            <p className="text-sm text-muted-foreground max-w-md mt-1">
              Student records, essays, and payment data are encrypted in transit and at rest. We never sell or use your data to train AI models.
            </p>
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
            <Link to="/dashboard">
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
          <div className="flex items-center gap-2 text-center md:text-left">
            <GraduationCap className="h-4 w-4 flex-shrink-0" />
            <span>© {new Date().getFullYear()} Primrose — The admissions practice operating system</span>
          </div>
          <div className="flex items-center gap-x-5 gap-y-2 flex-wrap justify-center">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#demo" className="hover:text-foreground">Demo</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
            <a href="#cta" className="hover:text-foreground">Early access</a>
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
            <a href="mailto:hello@primrose-iec.com" className="hover:text-foreground">Contact</a>
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
  const i = __featureIdx++;
  const accent = FEATURE_ACCENTS[i % FEATURE_ACCENTS.length];
  return (
    <Reveal delay={(i % 3) * 90} className="h-full">
      <div className="group h-full rounded-2xl border border-border/70 bg-white p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="font-semibold text-base">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
      </div>
    </Reveal>
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

function OrganizationBadge({ logo, name }: { logo: string; name: string }) {
  return (
    <div className="group flex flex-col items-center gap-2">
      <div className="h-14 px-4 rounded-lg bg-muted border border-border/80 flex items-center justify-center group-hover:border-primary/40 transition">
        <img src={logo} alt={`${name} logo`} className="h-10 w-auto max-w-[140px] object-contain" loading="lazy" />
      </div>
      <span className="text-[10px] text-muted-foreground max-w-[140px] leading-tight text-center">
        {name}
      </span>
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

function EssayHighlight({
  children,
  color,
  hover,
  feedback,
}: {
  children: ReactNode;
  color: string;
  hover: string;
  feedback: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={`cursor-help rounded px-1 py-0.5 transition-colors ${color} ${hover}`}
        >
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs">
        <p>{feedback}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function EssayReviewDemo() {
  const legend = [
    { color: "bg-sky-200", label: "Cliché or overused phrase" },
    { color: "bg-emerald-200", label: "Vague — needs specifics" },
    { color: "bg-rose-200", label: "Weak wording" },
    { color: "bg-amber-200", label: "Generic opening" },
    { color: "bg-violet-200", label: "Repetitive or empty referent" },
  ];

  return (
    <section id="ai" className="border-t border-border/60 bg-gradient-to-br from-violet-50/70 via-background to-sky-50/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium mb-5">
              <Sparkles className="h-3.5 w-3.5" /> AI review
            </div>
            <h2
              className="text-3xl md:text-4xl font-bold tracking-tight"
              style={{ fontFamily: "Sora, Inter, sans-serif" }}
            >
              Catch what a tired eye misses
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Primrose's AI reads every draft like a senior admissions consultant:
              clichés, vague claims, weak verbs, and missed moments get highlighted
              in color so students know exactly what to revise.
            </p>
            <p className="mt-6 text-xs uppercase tracking-wide text-muted-foreground font-medium">
              What the AI flags
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {legend.map((item) => (
                <li key={item.label} className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-sm ${item.color}`} />
                  <span className="text-muted-foreground">{item.label}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-foreground font-medium">
              Consultants keep full control: approve, edit, or delete every AI
              suggestion before it reaches the student.
            </p>
          </div>
          <TooltipProvider delayDuration={100}>
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-xl">
              <div className="flex items-center justify-between gap-3 mb-5">
                <h3 className="font-semibold text-sm sm:text-base">Your Essay with Feedback</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="h-3 w-3 rounded-sm bg-amber-200" />
                  Hover over highlighted text for feedback
                </div>
              </div>
              <div className="space-y-4 text-sm leading-[1.8] text-foreground">
                <p>
                  Throughout my life, I have always tried to do my best and make the most out of every opportunity. I believe that every{" "}
                  <EssayHighlight
                    color="bg-sky-200/70 text-sky-950"
                    hover="hover:bg-sky-300/80"
                    feedback="Cliché — the 'lessons from hardship' framing is overused. Try a specific moment."
                  >
                    experience teaches you something, even when it's not easy
                  </EssayHighlight>
                  . In school and outside of it, I've{" "}
                  <EssayHighlight
                    color="bg-emerald-200/70 text-emerald-950"
                    hover="hover:bg-emerald-300/80"
                    feedback="Vague — what exactly did you learn? Add a concrete example."
                  >
                    learned the importance of working hard, staying motivated
                  </EssayHighlight>
                  , and not giving up when things get difficult.
                </p>
                <p>
                  In high school, I tried to stay involved in{" "}
                  <EssayHighlight
                    color="bg-emerald-200/70 text-emerald-950"
                    hover="hover:bg-emerald-300/80"
                    feedback="Too general — name the clubs or roles so the reader sees commitment."
                  >
                    different activities
                  </EssayHighlight>
                  . I joined a few clubs, volunteered when I could, and{" "}
                  <EssayHighlight
                    color="bg-rose-200/70 text-rose-950"
                    hover="hover:bg-rose-300/80"
                    feedback="Weak verb — 'tried' undercuts the action. Use a stronger verb."
                  >
                    tried to help others
                  </EssayHighlight>
                  . I think being part of a team teaches you how to listen, communicate, and work with different kinds of people. Sometimes it was challenging to{" "}
                  <EssayHighlight
                    color="bg-sky-200/70 text-sky-950"
                    hover="hover:bg-sky-300/80"
                    feedback="Another cliché — 'time management' is a common essay conclusion. Show the impact instead."
                  >
                    balance schoolwork with other responsibilities, but it taught me time management and responsibility
                  </EssayHighlight>
                  .
                </p>
                <p>
                  <EssayHighlight
                    color="bg-amber-200/70 text-amber-950"
                    hover="hover:bg-amber-300/80"
                    feedback="Generic opening. Start with a specific class or question that hooked you."
                  >
                    Academically, I've always been curious and eager to learn new things
                  </EssayHighlight>
                  . I enjoy classes where I can think creatively and express my ideas. I like challenges because they push me to do better. Even when I don't get something right the first time, I keep trying until I understand.
                </p>
                <p>
                  I believe this mindset will help me in college, where I hope to grow both{" "}
                  <EssayHighlight
                    color="bg-violet-200/70 text-violet-950"
                    hover="hover:bg-violet-300/80"
                    feedback="Repetitive pairing — pick one dimension and develop it with detail."
                  >
                    personally and academically
                  </EssayHighlight>
                  . Outside of school,{" "}
                  <EssayHighlight
                    color="bg-violet-200/70 text-violet-950"
                    hover="hover:bg-violet-300/80"
                    feedback="Vague referent — 'experiences' doesn't tell the reader anything. Name the experience."
                  >
                    I've also had experiences
                  </EssayHighlight>
                  {" "}that helped me learn about myself and what matters to me.
                </p>
              </div>
            </div>
          </TooltipProvider>
        </div>
      </div>
    </section>
  );
}

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