import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNogaIdentity } from "@/lib/nogaIdentity";

export interface AnalysisIssue {
  id: string;
  criterionId: string;
  criterionName: string;
  color: string;
  startIndex: number;
  endIndex: number;
  highlightedText: string;
  problemType: string;
  problemDescription: string;
  recommendation: string;
  severity: 'low' | 'medium' | 'high';
}

export interface CriterionScore {
  id: string;
  name: string;
  score: number;
  color: string;
}

export interface AnalysisResult {
  overallScore: number;
  criteria: CriterionScore[];
  issues: AnalysisIssue[];
}

export interface FeedbackItem {
  id: string;
  text: string;
  source: 'ai' | 'manual';
  criterionName?: string;
  color?: string;
  startIndex?: number;
  endIndex?: number;
}

export interface HistoryEntry {
  id: string;
  version: number;
  feedback_items: FeedbackItem[];
  manual_notes: string | null;
  personal_message: string | null;
  status: string;
  created_at: string;
  essay_content?: string | null;
  track_changes?: unknown;
  ai_analysis?: unknown;
}

export interface Essay {
  id: string;
  title: string;
  studentName: string;
  studentId?: string;
  studentEmail?: string | null;
  prompt: string;
  content: string;
}

const APP_URL = "https://consultant.primrosecrm.com";

export function useEssayFeedback(essay: Essay, isOpen: boolean, onClose: () => void) {
  const { toast } = useToast();
  const identity = useNogaIdentity();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [manualNote, setManualNote] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [hoveredCommentId, setHoveredCommentId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const init = async () => {
        const alreadyAnalyzed = await loadExistingFeedback();
        if (!alreadyAnalyzed) analyzeEssay();
      };
      init();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const loadExistingFeedback = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('essay_feedback' as any)
        .select('feedback_items, manual_notes, personal_message, ai_analysis, track_changes')
        .eq('id', essay.id)
        .single();

      if (error) throw error;

      if (data) {
        setFeedbackItems(((data as any).feedback_items as FeedbackItem[]) || []);
        setManualNote((data as any).manual_notes || "");
        setPersonalMessage((data as any).personal_message || "");

        if ((data as any).ai_analysis) {
          setAnalysis((data as any).ai_analysis as AnalysisResult);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Error loading existing feedback:", error);
      return false;
    }
  };

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('essay_feedback_history' as any)
        .select('*')
        .eq('essay_id', essay.id)
        .order('version', { ascending: false });

      if (error) throw error;
      setHistory(((data as any[]) || []) as HistoryEntry[]);
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const analyzeEssay = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-essay', {
        body: { essayContent: essay.content, prompt: essay.prompt }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setAnalysis(data);
      toast({
        title: "Analysis Complete",
        description: `Found ${data.issues.length} areas for improvement`,
      });
    } catch (error) {
      console.error("Analysis error — continuing without AI:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addToFeedback = (issue: AnalysisIssue) => {
    const exists = feedbackItems.some(item => item.id === issue.id);
    if (exists) {
      toast({ title: "Already Added", description: "This issue is already in your feedback" });
      return;
    }
    setFeedbackItems(prev => [...prev, {
      id: issue.id,
      text: `[${issue.problemType}] ${issue.problemDescription} Recommendation: ${issue.recommendation}`,
      source: 'ai',
      criterionName: issue.criterionName,
      color: issue.color,
      startIndex: issue.startIndex,
      endIndex: issue.endIndex,
    }]);
    toast({ title: "Added to Feedback" });
  };

  const addManualNote = () => {
    if (!manualNote.trim()) return;
    setFeedbackItems(prev => [...prev, {
      id: `manual-${Date.now()}`,
      text: manualNote,
      source: 'manual',
    }]);
    setManualNote("");
  };

  const removeFeedbackItem = (id: string) => {
    setFeedbackItems(prev => prev.filter(item => item.id !== id));
  };

  const saveFeedback = async (
    status: 'draft' | 'in_progress' | 'sent',
    trackedChanges: { id: string; originalText: string; suggestedText: string; startIndex: number; endIndex: number }[],
  ) => {
    setIsSaving(true);
    try {
      if (!identity.advisorId) throw new Error("Could not resolve consultant identity");

      const { count } = await supabase
        .from('essay_feedback_history' as any)
        .select('*', { count: 'exact', head: true })
        .eq('essay_id', essay.id);

      const nextVersion = (count ?? 0) + 1;

      const { error: updateError } = await supabase
        .from('essay_feedback' as any)
        .update({
          counselor_id: identity.advisorId,
          feedback_items: JSON.parse(JSON.stringify(feedbackItems)),
          manual_notes: manualNote || null,
          personal_message: personalMessage || null,
          ai_analysis: analysis ? JSON.parse(JSON.stringify(analysis)) : null,
          track_changes: JSON.parse(JSON.stringify(trackedChanges)),
          status,
          sent_at: status === 'sent' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', essay.id);

      if (updateError) throw updateError;

      const { error: historyError } = await supabase
        .from('essay_feedback_history' as any)
        .insert({
          essay_id: essay.id,
          student_id: essay.studentId,
          counselor_id: identity.advisorId,
          version: nextVersion,
          essay_content: essay.content,
          feedback_items: JSON.parse(JSON.stringify(feedbackItems)),
          manual_notes: manualNote || null,
          personal_message: personalMessage || null,
          ai_analysis: analysis ? JSON.parse(JSON.stringify(analysis)) : null,
          track_changes: JSON.parse(JSON.stringify(trackedChanges)),
          status,
          sent_at: status === 'sent' ? new Date().toISOString() : null,
        } as any);

      if (historyError) throw historyError;

      toast({
        title: status === 'sent' ? "Feedback Sent!" : "Draft Saved",
        description: status === 'sent'
          ? "Feedback has been sent to the student"
          : `Saved as version ${nextVersion}`,
      });

      if (status === 'sent') {
        try {
          let studentEmail = essay.studentEmail || null;
          if (!studentEmail && essay.studentId) {
            const { data: studentRow } = await supabase
              .from('students')
              .select('email')
              .eq('id', essay.studentId)
              .maybeSingle();
            studentEmail = (studentRow as any)?.email ?? null;
          }

          if (studentEmail) {
            const { data: { session } } = await supabase.auth.getSession();
            await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/noga-send-counselor-feedback`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({
                  studentEmail,
                  studentName: essay.studentName,
                  counselorName: identity.advisorName || 'Your consultant',
                  essayLabel: essay.title,
                  personalMessage: personalMessage || '',
                  appUrl: APP_URL,
                }),
              }
            );
          } else {
            console.warn('Skipping feedback email — no student email on record');
          }
        } catch (notifyError) {
          console.error('Failed to send feedback notification:', notifyError);
        }
        onClose();
      }
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Could not save feedback",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const restoreVersion = (entry: HistoryEntry) => {
    setFeedbackItems(entry.feedback_items || []);
    setManualNote(entry.manual_notes || "");
    setPersonalMessage(entry.personal_message || "");
    toast({ title: `Restored version ${entry.version}` });
  };

  return {
    isAnalyzing,
    isSaving,
    analysis,
    feedbackItems,
    manualNote,
    setManualNote,
    personalMessage,
    setPersonalMessage,
    hoveredCommentId,
    setHoveredCommentId,
    history,
    isLoadingHistory,
    activeEvent: null,
    addToFeedback,
    addManualNote,
    removeFeedbackItem,
    loadHistory,
    saveFeedback,
    restoreVersion,
  };
}
