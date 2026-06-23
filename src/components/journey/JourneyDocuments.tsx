import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
  Plus,
  FileText,
  ChevronRight,
  MessageCircle,
  Check,
  GitBranch,
  GitCompareArrows,
  Loader2,
  History,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { diffWords } from 'diff';

const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  submitted: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  in_review: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  changes_requested: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
};
const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  in_review: 'In review',
  changes_requested: 'Changes requested',
  approved: 'Approved',
};

const stripHtml = (html: string) => {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};
const countWords = (html: string) => {
  const t = stripHtml(html).trim();
  return t ? t.split(/\s+/).length : 0;
};

export function JourneyDocuments({ studentId }: { studentId: string }) {
  const [docs, setDocs] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from('student_documents_v2')
      .select('*')
      .eq('student_id', studentId)
      .neq('kind', 'essay')
      .order('updated_at', { ascending: false });
    setDocs(data || []);
  };

  useEffect(() => {
    load();
  }, [studentId]);

  if (selectedDocId) {
    return (
      <DocumentDetail
        documentId={selectedDocId}
        onBack={() => {
          setSelectedDocId(null);
          load();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Essays & Documents</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Write directly in the editor. Snapshot a version anytime to lock it in and compare changes later.
          </p>
        </div>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> New document
            </Button>
          </DialogTrigger>
          <NewDocDialog
            studentId={studentId}
            onCreated={(id) => {
              setNewOpen(false);
              load();
              setSelectedDocId(id);
            }}
          />
        </Dialog>
      </div>

      {docs.length === 0 && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No documents yet. Start with your personal statement or any essay you're working on.
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {docs.map((d) => (
          <button key={d.id} onClick={() => setSelectedDocId(d.id)} className="w-full text-left">
            <Card className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4 flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{d.title}</div>
                  <div className="text-xs text-muted-foreground capitalize">{d.kind}</div>
                </div>
                <Badge variant="outline" className={STATUS_COLOR[d.status] || ''}>
                  {STATUS_LABEL[d.status] || d.status}
                </Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}

function NewDocDialog({
  studentId,
  onCreated,
}: {
  studentId: string;
  onCreated: (id: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState('supplement');
  const [prompt, setPrompt] = useState('');
  const [saving, setSaving] = useState(false);

  const create = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('student_documents_v2')
      .insert({
        student_id: studentId,
        title: title.trim(),
        kind,
        prompt_text: prompt || null,
      })
      .select('id')
      .single();
    setSaving(false);
    if (error || !data) {
      toast.error('Failed to create');
      return;
    }
    // Seed a blank V1 draft so the editor opens cleanly
    await supabase.from('student_document_versions').insert({
      document_id: data.id,
      version_no: 1,
      body_text: '',
      word_count: 0,
      created_by: 'student',
      status: 'draft',
    });
    onCreated(data.id);
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>New document</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1">
          <Label>Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Common App Personal Statement"
          />
        </div>
        <div className="space-y-1">
          <Label>Type</Label>
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="supplement">Supplement</SelectItem>
              <SelectItem value="resume">Resume / Activities</SelectItem>
              <SelectItem value="form">Form</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Prompt (optional)</Label>
          <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} />
        </div>
        <Button onClick={create} disabled={saving || !title.trim()} className="w-full">
          {saving ? 'Creating…' : 'Create document'}
        </Button>
      </div>
    </DialogContent>
  );
}

type View = 'edit' | 'compare';

function DocumentDetail({ documentId, onBack }: { documentId: string; onBack: () => void }) {
  const [doc, setDoc] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [view, setView] = useState<View>('edit');
  const [compareLeft, setCompareLeft] = useState<string | null>(null);
  const [compareRight, setCompareRight] = useState<string | null>(null);

  const load = async (preferLatest = false) => {
    const [{ data: d }, { data: v }] = await Promise.all([
      supabase.from('student_documents_v2').select('*').eq('id', documentId).maybeSingle(),
      supabase
        .from('student_document_versions')
        .select('*')
        .eq('document_id', documentId)
        .order('version_no', { ascending: false }),
    ]);
    setDoc(d);
    setVersions(v || []);
    if (v && v.length) {
      if (preferLatest || !activeId || !v.find((x) => x.id === activeId)) {
        setActiveId(v[0].id);
      }
    }
  };

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  const active = useMemo(() => versions.find((v) => v.id === activeId) || null, [versions, activeId]);
  const latest = versions[0];
  const isLatest = active && latest && active.id === latest.id;

  if (!doc) return null;

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to documents
      </button>

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight truncate">{doc.title}</h1>
          {doc.prompt_text && (
            <p className="text-sm text-muted-foreground mt-1 italic">"{doc.prompt_text}"</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={STATUS_COLOR[doc.status] || ''}>
            {STATUS_LABEL[doc.status] || doc.status}
          </Badge>
          <div className="flex rounded-md border overflow-hidden">
            <button
              onClick={() => setView('edit')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium flex items-center gap-1',
                view === 'edit' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
              )}
            >
              <FileText className="h-3 w-3" /> Editor
            </button>
            <button
              onClick={() => {
                setView('compare');
                if (versions.length >= 2) {
                  setCompareLeft(versions[1].id);
                  setCompareRight(versions[0].id);
                }
              }}
              className={cn(
                'px-3 py-1.5 text-xs font-medium flex items-center gap-1 border-l',
                view === 'compare' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
              )}
            >
              <GitCompareArrows className="h-3 w-3" /> Compare
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[200px_1fr] gap-4">
        {/* Versions rail */}
        <div className="space-y-1 lg:max-h-[70vh] lg:overflow-y-auto pr-1">
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1">
            <History className="h-3 w-3" /> Versions
          </div>
          {versions.map((v) => {
            const isActive = activeId === v.id;
            return (
              <button
                key={v.id}
                onClick={() => {
                  setActiveId(v.id);
                  setView('edit');
                }}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors',
                  isActive ? 'border-primary bg-primary/5' : 'hover:bg-muted',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">V{v.version_no}</span>
                  {v.id === latest?.id && (
                    <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                      latest
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {new Date(v.created_at).toLocaleDateString()} · {v.word_count || 0} words
                </div>
                <div className="text-[10px] text-muted-foreground capitalize">
                  by {v.created_by} · {v.status}
                </div>
              </button>
            );
          })}
          {versions.length === 0 && (
            <div className="text-xs text-muted-foreground p-2">No versions yet.</div>
          )}
        </div>

        {/* Canvas */}
        <div className="min-w-0">
          {view === 'edit' && active && (
            <VersionEditor
              key={active.id}
              version={active}
              isLatest={!!isLatest}
              documentId={documentId}
              onSaved={(latestPreferred) => load(latestPreferred)}
            />
          )}
          {view === 'compare' && (
            <CompareView
              versions={versions}
              leftId={compareLeft}
              rightId={compareRight}
              onChangeLeft={setCompareLeft}
              onChangeRight={setCompareRight}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------- EDITOR -------------------- */

function VersionEditor({
  version,
  isLatest,
  documentId,
  onSaved,
}: {
  version: any;
  isLatest: boolean;
  documentId: string;
  onSaved: (preferLatest: boolean) => void;
}) {
  const [body, setBody] = useState<string>(version.body_text || '');
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [snapshotting, setSnapshotting] = useState(false);
  const timer = useRef<number | null>(null);

  // Reset when version changes
  useEffect(() => {
    setBody(version.body_text || '');
    setSavedAt(null);
  }, [version.id]);

  // Debounced autosave (only when editing the latest version)
  const scheduleSave = useCallback(
    (next: string) => {
      if (!isLatest) return;
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(async () => {
        await supabase
          .from('student_document_versions')
          .update({ body_text: next, word_count: countWords(next) })
          .eq('id', version.id);
        await supabase
          .from('student_documents_v2')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', documentId);
        setSavedAt(new Date());
      }, 800);
    },
    [version.id, isLatest, documentId],
  );

  const handleChange = (next: string) => {
    setBody(next);
    scheduleSave(next);
  };

  const snapshot = async () => {
    setSnapshotting(true);
    // Make sure the latest edits are saved first
    if (isLatest) {
      await supabase
        .from('student_document_versions')
        .update({ body_text: body, word_count: countWords(body), status: 'submitted' })
        .eq('id', version.id);
    }
    // Find next version number
    const { data: maxRow } = await supabase
      .from('student_document_versions')
      .select('version_no')
      .eq('document_id', documentId)
      .order('version_no', { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextNo = (maxRow?.version_no || 0) + 1;

    // Create a fresh editable draft seeded with the snapshotted body
    const { error } = await supabase.from('student_document_versions').insert({
      document_id: documentId,
      version_no: nextNo,
      body_text: body,
      word_count: countWords(body),
      created_by: 'student',
      status: 'draft',
    });
    setSnapshotting(false);
    if (error) {
      toast.error('Could not snapshot');
      return;
    }
    toast.success(`Snapshotted V${nextNo - 1} · now editing V${nextNo}`);
    onSaved(true);
  };

  const wordCount = countWords(body);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-sm text-muted-foreground flex items-center gap-3">
          <span className="font-medium text-foreground">V{version.version_no}</span>
          <span>{wordCount} words</span>
          {isLatest ? (
            savedAt ? (
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="h-3 w-3" /> Saved {savedAt.toLocaleTimeString()}
              </span>
            ) : (
              <span className="text-muted-foreground">Autosaving…</span>
            )
          ) : (
            <span className="text-amber-600">Read-only (older version)</span>
          )}
        </div>
        {isLatest && (
          <Button onClick={snapshot} size="sm" className="gap-1" disabled={snapshotting}>
            {snapshotting ? <Loader2 className="h-3 w-3 animate-spin" /> : <GitBranch className="h-3 w-3" />}
            Snapshot version
          </Button>
        )}
      </div>

      {isLatest ? (
        <RichTextEditor content={body} onChange={handleChange} />
      ) : (
        <Card>
          <CardContent
            className="prose prose-sm max-w-none p-6"
            // Show old versions read-only
            dangerouslySetInnerHTML={{ __html: body || '<p class="text-muted-foreground">Empty</p>' }}
          />
        </Card>
      )}

      <CommentsPanel version={version} />
    </div>
  );
}

/* -------------------- COMPARE / TRACK CHANGES -------------------- */

function CompareView({
  versions,
  leftId,
  rightId,
  onChangeLeft,
  onChangeRight,
}: {
  versions: any[];
  leftId: string | null;
  rightId: string | null;
  onChangeLeft: (id: string) => void;
  onChangeRight: (id: string) => void;
}) {
  const left = versions.find((v) => v.id === leftId);
  const right = versions.find((v) => v.id === rightId);

  if (versions.length < 2) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          You need at least two versions to compare. Snapshot the current draft to create another one.
        </CardContent>
      </Card>
    );
  }

  const leftText = left ? stripHtml(left.body_text || '') : '';
  const rightText = right ? stripHtml(right.body_text || '') : '';
  const parts = useMemo(() => diffWords(leftText, rightText), [leftText, rightText]);
  const added = parts.filter((p) => p.added).reduce((n, p) => n + (p.value.trim().split(/\s+/).filter(Boolean).length || 0), 0);
  const removed = parts.filter((p) => p.removed).reduce((n, p) => n + (p.value.trim().split(/\s+/).filter(Boolean).length || 0), 0);

  return (
    <div className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Older version</Label>
          <Select value={leftId || undefined} onValueChange={onChangeLeft}>
            <SelectTrigger>
              <SelectValue placeholder="Choose…" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {versions.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  V{v.version_no} · {new Date(v.created_at).toLocaleDateString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Newer version</Label>
          <Select value={rightId || undefined} onValueChange={onChangeRight}>
            <SelectTrigger>
              <SelectValue placeholder="Choose…" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {versions.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  V{v.version_no} · {new Date(v.created_at).toLocaleDateString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-emerald-200 dark:bg-emerald-500/40" />
          +{added} added
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-rose-200 dark:bg-rose-500/40" />
          −{removed} removed
        </span>
      </div>

      <Card>
        <CardContent className="p-6 whitespace-pre-wrap leading-relaxed text-[15px]">
          {parts.map((p, i) => {
            if (p.added)
              return (
                <span
                  key={i}
                  className="bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-100 rounded-sm px-0.5"
                >
                  {p.value}
                </span>
              );
            if (p.removed)
              return (
                <span
                  key={i}
                  className="bg-rose-100 text-rose-900 line-through dark:bg-rose-500/20 dark:text-rose-100 rounded-sm px-0.5"
                >
                  {p.value}
                </span>
              );
            return <span key={i}>{p.value}</span>;
          })}
          {!leftText && !rightText && (
            <span className="text-muted-foreground">Both versions are empty.</span>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------- COMMENTS -------------------- */

function CommentsPanel({ version }: { version: any }) {
  const [comments, setComments] = useState<any[]>([]);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from('student_document_comments')
      .select('*')
      .eq('version_id', version.id)
      .order('created_at');
    setComments(data || []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version.id]);

  const post = async () => {
    if (!draft.trim()) return;
    setPosting(true);
    const { error } = await supabase.from('student_document_comments').insert({
      version_id: version.id,
      author: 'student',
      body: draft.trim(),
    });
    setPosting(false);
    if (error) {
      toast.error('Failed to post');
      return;
    }
    setDraft('');
    load();
  };

  const resolve = async (id: string) => {
    await supabase
      .from('student_document_comments')
      .update({ resolved_at: new Date().toISOString() })
      .eq('id', id);
    load();
  };

  return (
    <div className="space-y-2">
      <div className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1">
        <MessageCircle className="h-3 w-3" /> Comments on V{version.version_no} ({comments.length})
      </div>
      <Card>
        <CardContent className="p-3 space-y-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            placeholder="Leave a note for your consultant…"
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={post} disabled={posting || !draft.trim()}>
              Post comment
            </Button>
          </div>
        </CardContent>
      </Card>
      {comments.map((c) => (
        <Card key={c.id} className={c.resolved_at ? 'opacity-50' : ''}>
          <CardContent className="p-3 text-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium capitalize">{c.author}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {new Date(c.created_at).toLocaleString()}
                </span>
                {!c.resolved_at && (
                  <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => resolve(c.id)}>
                    <Check className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            <div className="whitespace-pre-wrap">{c.body}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
