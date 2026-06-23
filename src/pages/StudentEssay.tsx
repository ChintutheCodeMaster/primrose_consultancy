import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Send, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useNogaIdentity } from '@/lib/nogaIdentity';

const wordCount = (text: string): number =>
  text.trim() ? text.trim().split(/\s+/).length : 0;

export default function StudentEssay() {
  const { id: routeId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const identity = useNogaIdentity();

  const isNew = !routeId || routeId === 'new';
  const [essayId, setEssayId] = useState<string | null>(isNew ? null : routeId!);
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [targetSchool, setTargetSchool] = useState('');
  const [wordLimit, setWordLimit] = useState<string>('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<string>('draft');
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dirty, setDirty] = useState(false);

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isNew || !essayId) return;
    (async () => {
      const { data } = await supabase
        .from('essay_feedback' as any)
        .select('*')
        .eq('id', essayId)
        .maybeSingle();
      if (data) {
        const row = data as any;
        setTitle(row.essay_title || '');
        setPrompt(row.essay_prompt || '');
        setTargetSchool(row.target_school || '');
        setWordLimit(row.word_limit ? String(row.word_limit) : '');
        setContent(row.essay_content || '');
        setStatus(row.status || 'draft');
      }
      setIsLoading(false);
    })();
  }, [essayId, isNew]);

  const saveDraft = async (opts?: { silent?: boolean }): Promise<string | null> => {
    if (!identity.studentId) return null;
    if (!title.trim() && !content.trim()) return essayId;

    setIsSaving(true);
    try {
      if (essayId) {
        const { error } = await supabase
          .from('essay_feedback' as any)
          .update({
            essay_title: title || 'Untitled essay',
            essay_prompt: prompt || null,
            target_school: targetSchool || null,
            word_limit: wordLimit ? Number(wordLimit) : null,
            essay_content: content,
            updated_at: new Date().toISOString(),
          } as any)
          .eq('id', essayId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('essay_feedback' as any)
          .insert({
            student_id: identity.studentId,
            essay_title: title || 'Untitled essay',
            essay_prompt: prompt || null,
            target_school: targetSchool || null,
            word_limit: wordLimit ? Number(wordLimit) : null,
            essay_content: content,
            status: 'draft',
          } as any)
          .select('id')
          .single();
        if (error) throw error;
        setEssayId((data as any).id);
        window.history.replaceState(null, '', `/student/essay/${(data as any).id}`);
        if (!opts?.silent) toast.success('Draft created');
        setDirty(false);
        return (data as any).id;
      }
      setDirty(false);
      if (!opts?.silent) toast.success('Draft saved');
      return essayId;
    } catch (err) {
      console.error('Save failed', err);
      if (!opts?.silent) toast.error('Save failed');
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!dirty) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      saveDraft({ silent: true });
    }, 1500);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, prompt, targetSchool, wordLimit, content, dirty]);

  const markDirty = () => setDirty(true);

  const submitForReview = async () => {
    if (!content.trim()) {
      toast.error('Add some content before submitting');
      return;
    }
    if (!identity.studentId) {
      toast.error('Could not resolve student account');
      return;
    }

    setIsSubmitting(true);
    try {
      const savedId = await saveDraft({ silent: true });
      if (!savedId) throw new Error('Could not save before submit');

      const { data: studentRow } = await supabase
        .from('students')
        .select('advisor_id, name')
        .eq('id', identity.studentId)
        .maybeSingle();

      const advisorId = (studentRow as any)?.advisor_id ?? null;

      const { error: updateError } = await supabase
        .from('essay_feedback' as any)
        .update({
          status: 'pending',
          counselor_id: advisorId,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', savedId);
      if (updateError) throw updateError;

      if (advisorId) {
        const { data: advisor } = await supabase
          .from('advisors')
          .select('name, email')
          .eq('id', advisorId)
          .maybeSingle();
        const advisorEmail = (advisor as any)?.email;
        if (advisorEmail) {
          const { data: { session } } = await supabase.auth.getSession();
          fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/noga-send-new-essay-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({
              counselorEmail: advisorEmail,
              counselorName: (advisor as any).name || 'Consultant',
              studentName: (studentRow as any)?.name || identity.studentName || 'Student',
              essayLabel: title || 'Untitled essay',
              applicationName: targetSchool || 'Essay',
              appUrl: 'https://consultant.primrosecrm.com',
            }),
          }).catch((err) => console.error('Notification failed', err));
        }
      }

      toast.success('Submitted for review');
      navigate('/student/essays');
    } catch (err) {
      console.error('Submit failed', err);
      toast.error('Could not submit. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (identity.loading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!identity.studentId) {
    return <Navigate to="/student" replace />;
  }

  if (status === 'sent' && essayId) {
    return <Navigate to={`/student/essay/${essayId}/edit`} replace />;
  }

  const readOnly = status === 'pending' || status === 'in_progress';
  const wc = wordCount(content);
  const overLimit = wordLimit && wc > Number(wordLimit);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b sticky top-0 z-10 bg-background">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button asChild variant="ghost" size="sm">
              <Link to="/student/essays">
                <ArrowLeft className="h-4 w-4 mr-1" /> Essays
              </Link>
            </Button>
            <FileText className="h-5 w-5 text-primary shrink-0" />
            <h1 className="font-semibold truncate">{title || 'Untitled essay'}</h1>
            {readOnly && <Badge variant="secondary">Awaiting feedback</Badge>}
            {dirty && !readOnly && <Badge variant="outline" className="text-xs">Unsaved</Badge>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">
              <span className={overLimit ? 'text-destructive font-medium' : ''}>{wc}</span>
              {wordLimit && <span> / {wordLimit}</span>} words
            </span>
            {!readOnly && (
              <>
                <Button variant="outline" size="sm" onClick={() => saveDraft()} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save
                </Button>
                <Button size="sm" onClick={submitForReview} disabled={isSubmitting || !content.trim()}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  Submit for review
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <Card>
          <CardContent className="p-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Title</label>
              <Input
                value={title}
                onChange={(e) => { setTitle(e.target.value); markDirty(); }}
                placeholder="e.g. Why I want to study abroad"
                disabled={readOnly}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Target school (optional)</label>
                <Input
                  value={targetSchool}
                  onChange={(e) => { setTargetSchool(e.target.value); markDirty(); }}
                  placeholder="e.g. Stanford"
                  disabled={readOnly}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Word limit (optional)</label>
                <Input
                  type="number"
                  value={wordLimit}
                  onChange={(e) => { setWordLimit(e.target.value); markDirty(); }}
                  placeholder="e.g. 650"
                  disabled={readOnly}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Prompt (optional)</label>
              <Textarea
                value={prompt}
                onChange={(e) => { setPrompt(e.target.value); markDirty(); }}
                placeholder="Paste the essay prompt here if there is one"
                disabled={readOnly}
                rows={2}
                className="mt-1 resize-none"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 focus-within:border-primary/50 transition-colors">
          <CardContent className="p-0">
            <Textarea
              value={content}
              onChange={(e) => { setContent(e.target.value); markDirty(); }}
              placeholder="Start writing your essay…"
              disabled={readOnly}
              className="min-h-[600px] resize-none border-0 focus-visible:ring-0 text-base leading-relaxed p-6 font-serif"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
