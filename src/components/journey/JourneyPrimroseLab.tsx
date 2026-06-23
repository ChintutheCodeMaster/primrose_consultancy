import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FlaskConical, Sparkles, Loader2, RefreshCw, Save,
  AlertCircle, ArrowLeftRight, BookOpen, Fingerprint,
  Target, Mic, TrendingUp, Star,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePrimroseLab, type LabFeedback, type LabVersion } from '@/hooks/usePrimroseLab';
import { useNogaIdentity } from '@/lib/nogaIdentity';

type DimKey = 'authenticity' | 'specificity' | 'voice' | 'narrativeStrength' | 'memorability';

const DIM_CONFIG: Record<DimKey, {
  label: string;
  Icon: React.ElementType;
  gradient: string;
  bg: string;
  border: string;
  textColor: string;
  bar: string;
}> = {
  authenticity: {
    label: 'Authenticity',
    Icon: Fingerprint,
    gradient: 'from-sky-500 to-cyan-400',
    bg: 'bg-sky-50/70',
    border: 'border-sky-200',
    textColor: 'text-sky-700',
    bar: 'bg-sky-500',
  },
  specificity: {
    label: 'Specificity',
    Icon: Target,
    gradient: 'from-violet-500 to-purple-400',
    bg: 'bg-violet-50/70',
    border: 'border-violet-200',
    textColor: 'text-violet-700',
    bar: 'bg-violet-500',
  },
  voice: {
    label: 'Voice',
    Icon: Mic,
    gradient: 'from-rose-500 to-pink-400',
    bg: 'bg-rose-50/70',
    border: 'border-rose-200',
    textColor: 'text-rose-700',
    bar: 'bg-rose-500',
  },
  narrativeStrength: {
    label: 'Narrative Strength',
    Icon: TrendingUp,
    gradient: 'from-amber-500 to-orange-400',
    bg: 'bg-amber-50/70',
    border: 'border-amber-200',
    textColor: 'text-amber-700',
    bar: 'bg-amber-500',
  },
  memorability: {
    label: 'Memorability',
    Icon: Star,
    gradient: 'from-emerald-500 to-teal-400',
    bg: 'bg-emerald-50/70',
    border: 'border-emerald-200',
    textColor: 'text-emerald-700',
    bar: 'bg-emerald-500',
  },
};

const LABEL_CONFIG = {
  'Strong Hook': {
    container: 'bg-emerald-50 border-2 border-emerald-200',
    textColor: 'text-emerald-700',
    scoreColor: 'text-emerald-600',
    dot: 'bg-emerald-500',
    tagline: 'This hook lands.',
  },
  'Promising': {
    container: 'bg-blue-50 border-2 border-blue-200',
    textColor: 'text-blue-700',
    scoreColor: 'text-blue-600',
    dot: 'bg-blue-500',
    tagline: 'Getting there.',
  },
  'Needs Work': {
    container: 'bg-slate-50 border-2 border-slate-200',
    textColor: 'text-slate-600',
    scoreColor: 'text-slate-500',
    dot: 'bg-slate-400',
    tagline: 'Room to improve.',
  },
  'Blends In': {
    container: 'bg-red-50 border-2 border-red-200',
    textColor: 'text-red-600',
    scoreColor: 'text-red-500',
    dot: 'bg-red-400',
    tagline: 'Too familiar.',
  },
} as const;

const DIMS: DimKey[] = ['authenticity', 'specificity', 'voice', 'narrativeStrength', 'memorability'];

interface EssayRow {
  id: string;
  essay_title: string;
  essay_content: string;
}

const DimensionCard = ({ dimKey, data, index }: { dimKey: DimKey; data: { score: number; insight: string }; index: number }) => {
  const cfg = DIM_CONFIG[dimKey];
  const { Icon } = cfg;
  return (
    <div
      style={{ animationDelay: `${index * 60}ms` }}
      className={`rounded-2xl border-2 ${cfg.border} ${cfg.bg} backdrop-blur p-5 flex flex-col gap-3 animate-slide-up-sm card-lift`}
    >
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 font-semibold ${cfg.textColor}`}>
          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center shrink-0 shadow-sm`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          {cfg.label}
        </div>
        <span className={`text-3xl font-black ${cfg.textColor}`}>{data.score}</span>
      </div>
      <div className="relative h-2 rounded-full bg-white/70 overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${cfg.bar} transition-all duration-700`}
          style={{ width: `${data.score}%` }}
        />
      </div>
      <p className={`text-sm ${cfg.textColor} opacity-90 leading-snug`}>{data.insight}</p>
    </div>
  );
};

const OverallBadge = ({
  label,
  overall,
  scoreDelta,
}: {
  label: string;
  overall: number;
  scoreDelta: number | null;
}) => {
  const cfg = LABEL_CONFIG[label as keyof typeof LABEL_CONFIG] ?? LABEL_CONFIG['Needs Work'];
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className={`inline-flex items-center gap-4 rounded-2xl px-5 py-3 ${cfg.container} shadow-sm`}>
        <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot} shrink-0`} />
        <div>
          <p className={`text-base font-bold leading-none ${cfg.textColor}`}>{label}</p>
          <p className={`text-xs mt-0.5 ${cfg.textColor} opacity-70`}>{cfg.tagline}</p>
        </div>
        <div className={`ml-1 text-4xl font-black leading-none ${cfg.scoreColor}`}>{overall}</div>
      </div>
      {scoreDelta !== null && scoreDelta !== 0 && (
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${
          scoreDelta > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
        }`}>
          {scoreDelta > 0 ? '+' : ''}{scoreDelta} from your rewrite
        </div>
      )}
    </div>
  );
};

const ActionBtn = ({
  action,
  isActive,
  isLoading,
  onClick,
}: {
  action: string;
  isActive: boolean;
  isLoading: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    disabled={isLoading && !isActive}
    className={`
      px-4 py-2 rounded-full text-sm font-medium border-2 transition-all duration-200 press-soft
      ${isActive
        ? 'bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-200'
        : 'bg-white/70 backdrop-blur text-violet-700 border-violet-200 hover:border-violet-400 hover:bg-violet-50'
      }
    `}
  >
    {isLoading && isActive ? (
      <span className="flex items-center gap-1.5">
        <Loader2 className="h-3 w-3 animate-spin" /> Loading…
      </span>
    ) : action}
  </button>
);

const VersionPill = ({
  version,
  isActive,
  isCompareSelected,
  onClick,
}: {
  version: LabVersion;
  isActive: boolean;
  isCompareSelected: boolean;
  onClick: () => void;
}) => {
  const overall = Math.round(DIMS.reduce((s, k) => s + version.feedback[k].score, 0) / DIMS.length);
  const cfg = LABEL_CONFIG[version.feedback.overallLabel as keyof typeof LABEL_CONFIG] ?? LABEL_CONFIG['Needs Work'];
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all press-soft
        ${isActive ? 'border-violet-500 bg-violet-50 text-violet-700' : ''}
        ${isCompareSelected ? 'border-blue-500 bg-blue-50 text-blue-700' : ''}
        ${!isActive && !isCompareSelected ? 'border-gray-200 bg-white/70 backdrop-blur text-gray-600 hover:border-gray-300' : ''}
      `}
    >
      <span className="font-bold">{version.label}</span>
      <span className={`text-xs px-1.5 py-0.5 rounded-full ${cfg.dot} text-white`}>{overall}</span>
    </button>
  );
};

const CompareView = ({ vA, vB }: { vA: LabVersion; vB: LabVersion }) => {
  const overallA = Math.round(DIMS.reduce((s, k) => s + vA.feedback[k].score, 0) / DIMS.length);
  const overallB = Math.round(DIMS.reduce((s, k) => s + vB.feedback[k].score, 0) / DIMS.length);
  const delta = overallB - overallA;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
      {([{ v: vA, overall: overallA }, { v: vB, overall: overallB }] as const).map(({ v, overall }, i) => (
        <div key={v.id} className="border-2 border-gray-200 rounded-2xl p-5 space-y-4 bg-white/80 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-700 text-lg">{v.label}</span>
            <div className="flex items-center gap-2">
              {i === 1 && delta !== 0 && (
                <span className={`text-sm font-bold ${delta > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {delta > 0 ? '+' : ''}{delta}
                </span>
              )}
              <span className="text-2xl font-black text-gray-800">{overall}</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 bg-gray-50 rounded-xl p-3 leading-relaxed line-clamp-4 italic">
            "{v.text.slice(0, 200)}{v.text.length > 200 ? '…' : ''}"
          </p>
          <div className="space-y-2">
            {DIMS.map(k => {
              const cfg = DIM_CONFIG[k];
              const scoreA = vA.feedback[k].score;
              const scoreB = vB.feedback[k].score;
              const d = scoreB - scoreA;
              return (
                <div key={k} className="flex items-center gap-2">
                  <span className={`text-xs font-medium w-28 shrink-0 ${cfg.textColor}`}>{cfg.label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className={`h-full rounded-full ${cfg.bar} transition-all`} style={{ width: `${v.feedback[k].score}%` }} />
                  </div>
                  <span className="text-xs font-bold text-gray-700 w-8 text-right">{v.feedback[k].score}</span>
                  {i === 1 && d !== 0 && (
                    <span className={`text-xs font-bold w-8 ${d > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {d > 0 ? '+' : ''}{d}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export function JourneyPrimroseLab() {
  const identity = useNogaIdentity();
  const [text, setText] = useState('');
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersionIds, setCompareVersionIds] = useState<[string | undefined, string | undefined]>([undefined, undefined]);
  const [scoreBeforeExplore, setScoreBeforeExplore] = useState<number | null>(null);
  const [essays, setEssays] = useState<EssayRow[]>([]);

  const {
    analyzeState,
    suggestState,
    versions,
    activeVersionId,
    setActiveVersionId,
    analyze,
    getSuggestions,
    saveVersion,
    resetAnalysis,
  } = usePrimroseLab();

  useEffect(() => {
    if (!identity.studentId) return;
    (async () => {
      const { data } = await supabase
        .from('essay_feedback' as any)
        .select('id, essay_title, essay_content')
        .eq('student_id', identity.studentId)
        .order('updated_at', { ascending: false });
      setEssays(((data as any[]) ?? []) as EssayRow[]);
    })();
  }, [identity.studentId]);

  const isAnalyzing = analyzeState.status === 'analyzing';
  const hasResult = analyzeState.status === 'success';
  const feedback = hasResult ? (analyzeState as { status: 'success'; feedback: LabFeedback }).feedback : null;

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const canAnalyze = wordCount >= 3 && !isAnalyzing;

  const overall = feedback ? Math.round(DIMS.reduce((s, k) => s + feedback[k].score, 0) / DIMS.length) : 0;

  const scoreDelta = (scoreBeforeExplore !== null && hasResult)
    ? overall - scoreBeforeExplore
    : null;

  const activeSuggestion = suggestState.status === 'success' || suggestState.status === 'loading'
    ? (suggestState as { action: string }).action
    : null;

  const handleLoadEssay = (essayId: string) => {
    const essay = essays.find(e => e.id === essayId);
    if (essay) setText(essay.essay_content || '');
  };

  const handleAnalyze = () => {
    if (canAnalyze) {
      setScoreBeforeExplore(hasResult ? overall : null);
      analyze(text);
    }
  };

  const handleActionClick = (action: string) => {
    if (suggestState.status === 'success' && (suggestState as any).action === action) return;
    getSuggestions(text, action);
  };

  const handleSave = () => {
    if (!feedback) return;
    saveVersion(text, feedback);
  };

  const handleReset = () => {
    setText('');
    resetAnalysis();
    setCompareMode(false);
    setCompareVersionIds([undefined, undefined]);
    setScoreBeforeExplore(null);
  };

  const handleToggleCompare = (versionId: string) => {
    setCompareVersionIds(prev => {
      if (prev[0] === versionId) return [undefined, prev[1]];
      if (prev[1] === versionId) return [prev[0], undefined];
      if (!prev[0]) return [versionId, prev[1]];
      if (!prev[1]) return [prev[0], versionId];
      return [versionId, prev[1]];
    });
  };

  const compareVersionA = versions.find(v => v.id === compareVersionIds[0]);
  const compareVersionB = versions.find(v => v.id === compareVersionIds[1]);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-white/70 via-violet-50/40 to-indigo-50/40 backdrop-blur-xl p-6 sm:p-7 shadow-[0_8px_30px_-12px_hsl(263_70%_50%/0.18)] animate-slide-up">
        <div className="absolute -top-16 -right-8 h-40 w-40 rounded-full bg-violet-300/25 blur-3xl animate-float" />
        <div className="absolute -bottom-12 left-16 h-32 w-32 rounded-full bg-indigo-300/20 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/70 border border-violet-200/60 px-3 py-1 text-xs font-medium text-violet-700 mb-3 backdrop-blur">
            <FlaskConical className="h-3 w-3" /> Primrose Lab
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gradient-primary" style={{ fontFamily: 'Sora, Inter, sans-serif' }}>
            Your essay workshop
          </h2>
          <p className="text-muted-foreground mt-2 text-sm max-w-md">
            No pressure. Just progress. Test a hook, get honest feedback, iterate fast.
          </p>
        </div>
      </div>

      {/* Input Phase */}
      {!hasResult && !isAnalyzing && (
        <Card className="card-lift rounded-2xl border-white/60 bg-white/80 backdrop-blur animate-slide-up stagger-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-foreground flex items-center gap-2 text-base tracking-tight">
                <BookOpen className="h-5 w-5 text-violet-500" />
                Paste your text
              </CardTitle>
              {essays.length > 0 && (
                <Select onValueChange={handleLoadEssay}>
                  <SelectTrigger className="w-52 h-8 text-xs border-violet-200 rounded-lg bg-white/70">
                    <SelectValue placeholder="Load from my essays" />
                  </SelectTrigger>
                  <SelectContent>
                    {essays.map(e => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.essay_title || 'Untitled essay'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              id="lab-textarea"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste 1–5 sentences here. A hook, an opening, a paragraph you're not sure about. The shorter the better to start."
              className="min-h-[200px] text-base leading-relaxed border-violet-100 focus:border-violet-300 resize-none rounded-xl"
            />
            <div className="flex items-center justify-between">
              <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                wordCount === 0 ? 'bg-gray-100 text-gray-400' :
                wordCount < 5 ? 'bg-amber-100 text-amber-700' :
                wordCount <= 120 ? 'bg-emerald-100 text-emerald-700' :
                'bg-orange-100 text-orange-700'
              }`}>
                {wordCount} {wordCount === 1 ? 'word' : 'words'}
                {wordCount > 120 && ' — try a shorter excerpt'}
              </span>
              <Button
                onClick={handleAnalyze}
                disabled={!canAnalyze}
                className="rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-md shadow-violet-500/25 hover:shadow-lg hover:shadow-violet-500/35 transition-all press-soft font-semibold"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Analyze
              </Button>
            </div>
            {analyzeState.status === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{analyzeState.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Loading Phase */}
      {isAnalyzing && (
        <div className="flex flex-col items-center justify-center py-24 gap-6 animate-fade-in">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-xl shadow-violet-300">
              <FlaskConical className="h-8 w-8 text-white" />
            </div>
            <div className="absolute inset-0 rounded-full border-4 border-violet-300 animate-ping opacity-60" />
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-foreground">Reading your text…</p>
            <p className="text-muted-foreground mt-1">Being honest takes a moment.</p>
          </div>
        </div>
      )}

      {/* Results Phase */}
      {hasResult && feedback && (
        <div className="space-y-5 animate-fade-in">
          {/* Overall badge + controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <OverallBadge label={feedback.overallLabel} overall={overall} scoreDelta={scoreDelta} />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                className="rounded-xl border-violet-200 text-violet-700 hover:bg-violet-50 bg-white/70 backdrop-blur press-soft"
              >
                <Save className="h-3.5 w-3.5 mr-1.5" />
                Save as {versions.length > 0 ? `V${versions.length + 1}` : 'V1'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50 bg-white/70 backdrop-blur press-soft"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Start over
              </Button>
            </div>
          </div>

          {/* Overall summary */}
          <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur px-6 py-4 shadow-sm animate-slide-up-sm">
            <p className="text-foreground text-base leading-relaxed italic">
              "{feedback.overallSummary}"
            </p>
          </div>

          {/* 5 dimension cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DIMS.map((k, i) => (
              <DimensionCard key={k} dimKey={k} data={feedback[k]} index={i} />
            ))}
          </div>

          {/* Edit + re-analyze */}
          <Card className="card-lift rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/40 backdrop-blur animate-slide-up stagger-5">
            <CardContent className="pt-5 space-y-3">
              <p className="text-sm font-semibold text-violet-700">
                Make changes then re-analyze to see your score move
              </p>
              <Textarea
                value={text}
                onChange={e => setText(e.target.value)}
                className="min-h-[120px] bg-white/80 border-violet-200 text-sm resize-none focus:border-violet-400 rounded-xl"
              />
              <div className="flex items-center justify-between">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  wordCount <= 120 ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {wordCount} words
                </span>
                <Button
                  onClick={handleAnalyze}
                  disabled={!canAnalyze}
                  size="sm"
                  className="rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-md shadow-violet-500/25 press-soft"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Re-analyze
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Action layer */}
          <div className="space-y-3 animate-slide-up stagger-6">
            <p className="text-sm font-semibold text-muted-foreground">What do you want to work on?</p>
            <div className="flex flex-wrap gap-2">
              {feedback.suggestedActions.map(action => (
                <ActionBtn
                  key={action}
                  action={action}
                  isActive={activeSuggestion === action}
                  isLoading={suggestState.status === 'loading' && (suggestState as any).action === action}
                  onClick={() => handleActionClick(action)}
                />
              ))}
            </div>

            {(suggestState.status === 'loading' || suggestState.status === 'success') && (
              <div className="rounded-2xl border-2 border-violet-100 bg-gradient-to-br from-violet-50 to-indigo-50 backdrop-blur p-5 space-y-3 animate-slide-up-sm">
                <div className="flex items-center gap-2 font-semibold text-violet-700">
                  <Sparkles className="h-4 w-4" />
                  {suggestState.status === 'loading' ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Loading suggestions…
                    </span>
                  ) : (
                    `How to: ${(suggestState as any).action}`
                  )}
                </div>
                {suggestState.status === 'success' && (
                  <ul className="space-y-2.5">
                    {(suggestState as any).suggestions.map((s: string, i: number) => (
                      <li key={i} className="flex gap-3 text-sm text-foreground leading-relaxed">
                        <span className="text-violet-400 font-bold mt-0.5 shrink-0 text-base">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Version history */}
          {versions.length > 0 && (
            <div className="space-y-3 border-t border-border/50 pt-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  Saved versions ({versions.length})
                </p>
                {versions.length >= 2 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCompareMode(m => !m)}
                    className="rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50 text-xs press-soft"
                  >
                    <ArrowLeftRight className="h-3 w-3 mr-1" />
                    {compareMode ? 'Hide compare' : 'Compare versions'}
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {versions.map(v => (
                  <VersionPill
                    key={v.id}
                    version={v}
                    isActive={!compareMode && activeVersionId === v.id}
                    isCompareSelected={compareMode && (compareVersionIds[0] === v.id || compareVersionIds[1] === v.id)}
                    onClick={() => {
                      if (compareMode) {
                        handleToggleCompare(v.id);
                      } else {
                        setActiveVersionId(v.id);
                        setText(v.text);
                      }
                    }}
                  />
                ))}
              </div>

              {compareMode && compareVersionA && compareVersionB && (
                <CompareView vA={compareVersionA} vB={compareVersionB} />
              )}

              {compareMode && (!compareVersionA || !compareVersionB) && (
                <p className="text-sm text-blue-600 bg-blue-50 rounded-xl px-4 py-3 border border-blue-100">
                  Select two versions above to compare them side by side.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
