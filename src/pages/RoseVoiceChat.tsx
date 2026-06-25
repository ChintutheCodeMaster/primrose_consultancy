import { useEffect, useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Loader2,
  Mic,
  MicOff,
  PhoneOff,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { useRoseVoiceChat, type ConversationTurn } from '@/hooks/useRoseVoiceChat';

// ===========================================================================
// RoseVoiceChat (Noga)
// ---------------------------------------------------------------------------
// Mirror of TPR's InterviewSimulator, rebranded as "Speak with Rose" with
// Noga's rose color palette. WebRTC plumbing lives in useRoseVoiceChat. After
// the call ends, we POST the transcript to noga-rose-voice-insights, which
// persists insights into noga.voice_insights.
// ===========================================================================

const UNIVERSITY_OPTIONS = [
  'Harvard University',
  'Yale University',
  'Princeton University',
  'Stanford University',
  'Massachusetts Institute of Technology',
  'University of Pennsylvania',
  'Columbia University',
  'University of Chicago',
  'Northwestern University',
  'Duke University',
  'Cornell University',
  'University of Cambridge',
  'University of Oxford',
  'London School of Economics',
  'Imperial College London',
  'University College London',
  'Other',
];

type Insight = { category: string; title: string; content: string };

function RoseOrb({ speaking }: { speaking: boolean }) {
  return (
    <div className="relative flex h-44 w-44 items-center justify-center">
      {/* Outer pulsing rings — pure CSS */}
      <span
        className={cn(
          'absolute inset-0 -m-8 rounded-full bg-rose-400/15 blur-sm',
          speaking ? 'animate-ping' : 'opacity-40',
        )}
        style={{ animationDuration: '2s' }}
      />
      <span
        className={cn(
          'absolute inset-0 -m-14 rounded-full bg-pink-400/10 blur-sm',
          speaking ? 'animate-ping' : 'opacity-30',
        )}
        style={{ animationDuration: '2.6s', animationDelay: '0.4s' }}
      />
      {/* Core orb */}
      <div
        className={cn(
          'relative z-10 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 via-rose-600 to-pink-700 shadow-2xl shadow-rose-500/40 transition-transform duration-300',
          speaking ? 'scale-110' : 'scale-100',
        )}
      >
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/25 to-transparent" />
        {speaking ? (
          <div className="flex items-end gap-[3px]">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="w-1.5 rounded-full bg-white/95 animate-pulse"
                style={{
                  height: `${16 + (i % 2 === 0 ? 10 : 4)}px`,
                  animationDuration: `${0.5 + i * 0.08}s`,
                  animationDelay: `${i * 0.07}s`,
                }}
              />
            ))}
          </div>
        ) : (
          <Volume2 className="h-12 w-12 text-white/95" />
        )}
      </div>
    </div>
  );
}

function Waveform({ active }: { active: boolean }) {
  const bars = useMemo(() => Array.from({ length: 28 }, (_, i) => i), []);
  return (
    <div className="flex h-8 items-end justify-center gap-[3px]">
      {bars.map((i) => (
        <span
          key={i}
          className={cn(
            'w-1 rounded-full transition-colors',
            active ? 'bg-rose-500/60 animate-pulse' : 'bg-rose-200',
          )}
          style={{
            height: active ? `${6 + ((i * 7) % 22)}px` : '4px',
            animationDuration: `${0.4 + (i % 5) * 0.08}s`,
            animationDelay: `${i * 0.03}s`,
          }}
        />
      ))}
    </div>
  );
}

function ConversationFeed({ history, live }: { history: ConversationTurn[]; live: string | null }) {
  return (
    <div className="space-y-2 overflow-y-auto pr-1" style={{ maxHeight: '40vh' }}>
      {history.length === 0 && !live ? (
        <p className="text-center text-xs italic text-muted-foreground">Transcript will appear here as you talk.</p>
      ) : null}
      {history.map((turn, i) => (
        <div
          key={i}
          className={cn(
            'flex gap-2 text-sm',
            turn.role === 'student' ? 'flex-row-reverse' : 'flex-row',
          )}
        >
          <div
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white',
              turn.role === 'rose' ? 'bg-gradient-to-br from-rose-500 to-pink-600' : 'bg-rose-700',
            )}
          >
            {turn.role === 'rose' ? 'R' : 'You'}
          </div>
          <div
            className={cn(
              'max-w-[80%] rounded-2xl px-3.5 py-2 text-foreground',
              turn.role === 'rose'
                ? 'bg-white border border-rose-100'
                : 'bg-rose-600/95 text-white',
            )}
          >
            {turn.text}
          </div>
        </div>
      ))}
      {live ? (
        <div className="flex gap-2 text-sm">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-xs font-semibold text-white">
            R
          </div>
          <div className="max-w-[80%] rounded-2xl border border-rose-100 bg-white px-3.5 py-2 text-foreground/80">
            <span className="italic">{live}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function WelcomeScreen({ onStart }: { onStart: (program: string, university: string) => void }) {
  const [program, setProgram] = useState('');
  const [university, setUniversity] = useState('');
  const valid = program.trim().length > 0 && university.trim().length > 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6 rounded-3xl border border-rose-100 bg-white/85 p-7 shadow-sm backdrop-blur animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/30">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-rose-700">Speak with Rose</p>
          <h2 className="text-xl font-semibold text-foreground">A 10-minute conversation with your AI strategist</h2>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Tell Rose a little about what you want to study and where, and she'll guide you through a warm, exploratory
        conversation. The takeaways are saved as insights so you can act on them later.
      </p>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Target university</label>
          <Select value={university} onValueChange={setUniversity}>
            <SelectTrigger className="h-11 rounded-xl border-rose-200/70 bg-white/80 focus:border-rose-400">
              <SelectValue placeholder="Pick a university…" />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              {UNIVERSITY_OPTIONS.map((u) => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Program</label>
          <Input
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            placeholder="e.g. Economics, Computer Science, Architecture…"
            className="h-11 rounded-xl border-rose-200/70 bg-white/80 focus-visible:border-rose-400"
          />
        </div>
      </div>

      <Button
        onClick={() => onStart(program.trim(), university.trim())}
        disabled={!valid}
        className="h-12 w-full rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/30 hover:shadow-lg hover:shadow-rose-500/40 transition-all press-soft"
      >
        <Mic className="mr-2 h-5 w-5" />
        Start voice chat with Rose
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Microphone access is required. The conversation is private and only the transcript is saved.
      </p>
    </div>
  );
}

function FinalFeedback({
  insights,
  quality,
  onRestart,
}: {
  insights: Insight[];
  quality: string | null;
  onRestart: () => void;
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-5 animate-fade-in">
      <div className="rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-50 to-pink-50 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-rose-700">Conversation insights</p>
            <h2 className="text-xl font-semibold text-foreground">
              {quality === 'strong'
                ? 'A rich, revealing conversation — well done.'
                : quality === 'average'
                  ? 'A solid conversation — here is what stood out.'
                  : 'A short conversation — share a little more next time.'}
            </h2>
          </div>
        </div>
      </div>
      {insights.length === 0 ? (
        <div className="rounded-3xl border border-rose-100 bg-white p-6 text-sm text-muted-foreground">
          Not enough was shared for Rose to extract meaningful insights yet. Try again and let the conversation flow a bit
          longer.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {insights.map((ins, i) => (
            <div key={i} className="rounded-2xl border border-rose-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">{ins.category}</p>
              <h3 className="mt-1 text-base font-semibold text-foreground">{ins.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{ins.content}</p>
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-center">
        <Button
          onClick={onRestart}
          className="rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/25 hover:shadow-lg press-soft"
        >
          Start another conversation
        </Button>
      </div>
    </div>
  );
}

export default function RoseVoiceChat() {
  const {
    connect,
    disconnect,
    connectionState,
    isConnected,
    isRoseSpeaking,
    isStudentSpeaking,
    roseTranscript,
    conversationHistory,
    error,
  } = useRoseVoiceChat();

  type Phase = 'welcome' | 'live' | 'analyzing' | 'feedback';
  const [phase, setPhase] = useState<Phase>('welcome');
  const [insights, setInsights] = useState<Insight[]>([]);
  const [quality, setQuality] = useState<string | null>(null);
  const [historyAtEnd, setHistoryAtEnd] = useState<ConversationTurn[]>([]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const handleStart = async (program: string, university: string) => {
    setPhase('live');
    await connect(program, university);
  };

  const handleEnd = async () => {
    const finalHistory = conversationHistory;
    setHistoryAtEnd(finalHistory);
    disconnect();
    if (finalHistory.length === 0) {
      setPhase('welcome');
      return;
    }
    setPhase('analyzing');
    try {
      const { data, error: fnError } = await supabase.functions.invoke('noga-rose-voice-insights', {
        body: { conversationHistory: finalHistory },
      });
      if (fnError) throw fnError;
      setInsights(data?.insights ?? []);
      setQuality(data?.quality ?? null);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? 'Could not extract insights.');
      setInsights([]);
      setQuality(null);
    } finally {
      setPhase('feedback');
    }
  };

  const handleRestart = () => {
    setInsights([]);
    setQuality(null);
    setHistoryAtEnd([]);
    setPhase('welcome');
  };

  return (
    <MainLayout>
      <div className="relative pb-12">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-rose-400/20 blur-3xl animate-float" />
          <div className="absolute -top-12 right-0 h-[360px] w-[360px] rounded-full bg-pink-300/20 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        </div>

        <div className="mx-auto max-w-5xl space-y-6 px-2">
          {/* Hero */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 via-rose-600 to-pink-700 p-6 sm:p-7 text-white shadow-lg">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-amber-200/20 blur-2xl" />
            <div className="relative flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-white/70">Voice conversation</p>
                <h1 className="text-2xl font-bold sm:text-3xl">Speak with Rose</h1>
                <p className="mt-0.5 text-sm text-white/85">A warm, 10-minute conversation that powers personalized coaching.</p>
              </div>
            </div>
          </div>

          {phase === 'welcome' ? <WelcomeScreen onStart={handleStart} /> : null}

          {phase === 'live' ? (
            <div className="grid gap-6 lg:grid-cols-[1fr,1fr]">
              {/* Rose side */}
              <div className="rounded-3xl border border-rose-100 bg-white/85 p-6 shadow-sm backdrop-blur">
                <div className="mb-4 flex items-center gap-2">
                  <span className={cn('h-2 w-2 rounded-full', isRoseSpeaking ? 'bg-rose-500 animate-pulse' : 'bg-rose-300')} />
                  <h2 className="text-base font-semibold text-foreground">Rose — your AI strategist</h2>
                </div>
                <div className="flex flex-col items-center gap-5 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 p-8 ring-1 ring-rose-100">
                  <RoseOrb speaking={isRoseSpeaking} />
                  <Waveform active={isRoseSpeaking} />
                  <p className="text-sm text-rose-700/80">
                    {connectionState === 'connecting'
                      ? 'Connecting to Rose…'
                      : isRoseSpeaking
                        ? 'Rose is speaking — listen carefully'
                        : isConnected
                          ? 'Waiting for your response…'
                          : 'Idle'}
                  </p>
                </div>
              </div>

              {/* Student side */}
              <div className="rounded-3xl border border-rose-100 bg-white/85 p-6 shadow-sm backdrop-blur">
                <div className="mb-4 flex items-center gap-2">
                  <span className={cn('h-2 w-2 rounded-full', isStudentSpeaking ? 'bg-rose-500 animate-pulse' : 'bg-rose-300')} />
                  <h2 className="text-base font-semibold text-foreground">You</h2>
                </div>
                <div className="flex flex-col items-center gap-4 rounded-2xl bg-gradient-to-br from-rose-50/70 to-pink-50/70 p-6 ring-1 ring-rose-100">
                  <div className={cn('flex h-20 w-20 items-center justify-center rounded-full transition-all',
                    isStudentSpeaking
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/40 scale-110'
                      : 'bg-rose-100 text-rose-700',
                  )}>
                    {isStudentSpeaking ? <Mic className="h-8 w-8" /> : <MicOff className="h-8 w-8" />}
                  </div>
                  <p className="text-xs text-rose-700/80">
                    {isStudentSpeaking ? 'Listening to you…' : 'Speak when you’re ready.'}
                  </p>
                </div>

                <div className="mt-5">
                  <ConversationFeed history={conversationHistory} live={isRoseSpeaking ? roseTranscript : null} />
                </div>

                <Button
                  variant="outline"
                  onClick={handleEnd}
                  className="mt-5 h-11 w-full rounded-xl border-rose-300 text-rose-700 hover:bg-rose-50"
                >
                  <PhoneOff className="mr-2 h-4 w-4" />
                  End conversation
                </Button>
              </div>
            </div>
          ) : null}

          {phase === 'analyzing' ? (
            <div className="mx-auto max-w-md space-y-4 rounded-3xl border border-rose-100 bg-white/85 p-8 text-center shadow-sm backdrop-blur">
              <Loader2 className="mx-auto h-7 w-7 animate-spin text-rose-600" />
              <p className="text-sm font-medium text-foreground">Rose is reflecting on your conversation…</p>
              <p className="text-xs text-muted-foreground">
                Just a moment — extracting insights from {historyAtEnd.length} exchanges.
              </p>
            </div>
          ) : null}

          {phase === 'feedback' ? (
            <FinalFeedback insights={insights} quality={quality} onRestart={handleRestart} />
          ) : null}
        </div>
      </div>
    </MainLayout>
  );
}
