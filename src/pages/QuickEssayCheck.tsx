import { useState } from 'react';
import { Loader2, MessageCircle, Sparkles } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { AnalysisResult } from '@/hooks/useEssayFeedback';

/**
 * Consultant-side "quick check" that reuses the same `analyze-essay` edge
 * function powering the student essay-feedback ecosystem. Same criteria,
 * same colors, same issue shape — just without saving to a student or
 * building structured feedback.
 */
export default function QuickEssayCheck() {
  const [essayContent, setEssayContent] = useState('');
  const [prompt, setPrompt] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const wordCount = essayContent.trim().split(/\s+/).filter(Boolean).length;
  const canAnalyze = wordCount >= 20 && !analyzing;

  const analyze = async () => {
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-essay', {
        body: { essayContent, prompt },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setAnalysis(data as AnalysisResult);
      toast.success(`Analyzed — ${(data as AnalysisResult).issues?.length ?? 0} issues found`);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? 'Could not analyze the essay. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setEssayContent('');
    setPrompt('');
    setAnalysis(null);
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Intro */}
        <div className="rounded-3xl border border-violet-200/70 bg-gradient-to-br from-violet-50 via-white to-rose-50 p-6 sm:p-7 shadow-sm">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/70 border border-violet-200/70 px-3 py-1 text-xs font-medium text-violet-700 mb-3 backdrop-blur">
            <Sparkles className="h-3 w-3" /> Quick check
          </div>
          <h1
            className="text-2xl sm:text-3xl font-bold tracking-tight"
            style={{ fontFamily: 'Sora, Inter, sans-serif' }}
          >
            Check a student essay quickly with AI
          </h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-2xl">
            For a more in-depth and personal analysis, ask the student to submit the essay through
            their workspace — we&apos;ll provide tailored feedback for them there.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Left: input + essay */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <div>
                <Label htmlFor="qec-prompt" className="text-xs font-medium">
                  Essay prompt{' '}
                  <span className="text-slate-400 font-normal">(optional)</span>
                </Label>
                <Input
                  id="qec-prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Common App essay prompt #1"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="qec-essay" className="text-xs font-medium">
                  Essay content
                </Label>
                <Textarea
                  id="qec-essay"
                  value={essayContent}
                  onChange={(e) => setEssayContent(e.target.value)}
                  placeholder="Paste the student's essay here…"
                  rows={16}
                  className="mt-1.5 text-sm leading-relaxed"
                />
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
                  {wordCount > 0 && wordCount < 20 && (
                    <span className="text-amber-600">Paste at least 20 words to analyze</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={analyze}
                  disabled={!canAnalyze}
                  className="gap-2 bg-gradient-to-r from-violet-600 to-rose-500 hover:from-violet-700 hover:to-rose-600 text-white border-0"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Analyzing…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> Analyze
                    </>
                  )}
                </Button>
                {(essayContent || analysis) && (
                  <Button
                    variant="ghost"
                    onClick={reset}
                    disabled={analyzing}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Right: results */}
          <div className="space-y-4">
            {analyzing && (
              <Card>
                <CardContent className="p-6 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
                  ))}
                </CardContent>
              </Card>
            )}

            {analysis && !analyzing && (
              <>
                {/* Overall score + criteria bars */}
                <Card>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-baseline justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Overall score
                      </p>
                      <span className="text-3xl font-bold tracking-tight">
                        {analysis.overallScore}
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {analysis.criteria?.map((c) => (
                        <div key={c.id}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="flex items-center gap-1.5 text-foreground">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: c.color }}
                              />
                              {c.name}
                            </span>
                            <span className="font-semibold text-muted-foreground">{c.score}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${c.score}%`,
                                backgroundColor: c.color,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Issues */}
                <Card>
                  <div className="px-4 py-2 border-b bg-muted/30">
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <MessageCircle className="h-3.5 w-3.5" />
                      Comments ({analysis.issues?.length ?? 0})
                    </p>
                  </div>
                  <ScrollArea className="max-h-[60vh]">
                    <div className="p-3 space-y-2">
                      {(analysis.issues ?? []).length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          <p className="text-xs">No issues surfaced.</p>
                        </div>
                      ) : (
                        analysis.issues.map((issue) => (
                          <div
                            key={issue.id}
                            className="rounded-xl border p-3 space-y-1.5"
                            style={{ borderLeftColor: issue.color, borderLeftWidth: 3 }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <div
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: issue.color }}
                                />
                                <span className="text-xs font-semibold truncate">
                                  {issue.criterionName}
                                </span>
                              </div>
                              <Badge
                                variant={
                                  issue.severity === 'high'
                                    ? 'destructive'
                                    : issue.severity === 'medium'
                                      ? 'secondary'
                                      : 'outline'
                                }
                                className="text-[10px] shrink-0"
                              >
                                {issue.severity}
                              </Badge>
                            </div>
                            {issue.highlightedText && (
                              <p
                                className="text-[11px] italic text-muted-foreground border-l-2 pl-2"
                                style={{ borderColor: `${issue.color}80` }}
                              >
                                “{issue.highlightedText}”
                              </p>
                            )}
                            <p className="text-xs font-medium text-foreground">
                              {issue.problemType}
                            </p>
                            <p className="text-xs text-muted-foreground leading-snug">
                              {issue.problemDescription}
                            </p>
                            <div className="pt-1 border-t border-border">
                              <p className="text-xs text-primary leading-snug">
                                💡 {issue.recommendation}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </Card>
              </>
            )}

            {!analysis && !analyzing && (
              <Card>
                <CardContent className="p-6 text-center">
                  <Sparkles className="h-8 w-8 mx-auto mb-3 text-violet-400" />
                  <p className="text-sm text-muted-foreground">
                    Paste an essay and click <strong>Analyze</strong> to see criterion scores
                    and issue-by-issue feedback.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
