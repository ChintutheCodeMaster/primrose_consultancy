import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Upload, FileText, ChevronRight, MessageCircle, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

export function JourneyDocuments({ studentId }: { studentId: string }) {
  const [docs, setDocs] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from('student_documents_v2')
      .select('*')
      .eq('student_id', studentId)
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
          <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Essays, forms, and anything else you and your consultant iterate on.
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
            onCreated={() => {
              setNewOpen(false);
              load();
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
          <button
            key={d.id}
            onClick={() => setSelectedDocId(d.id)}
            className="w-full text-left"
          >
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

function NewDocDialog({ studentId, onCreated }: { studentId: string; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState('essay');
  const [prompt, setPrompt] = useState('');
  const [saving, setSaving] = useState(false);

  const create = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('student_documents_v2').insert({
      student_id: studentId,
      title: title.trim(),
      kind,
      prompt_text: prompt || null,
    });
    setSaving(false);
    if (error) {
      toast.error('Failed to create');
      return;
    }
    onCreated();
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>New document</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Common App Personal Statement" />
        </div>
        <div className="space-y-1">
          <Label>Type</Label>
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="essay">Essay</SelectItem>
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
          {saving ? 'Creating...' : 'Create document'}
        </Button>
      </div>
    </DialogContent>
  );
}

function DocumentDetail({ documentId, onBack }: { documentId: string; onBack: () => void }) {
  const [doc, setDoc] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<any | null>(null);

  const load = async () => {
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
    if (v && v.length && !selectedVersion) setSelectedVersion(v[0]);
  };

  useEffect(() => {
    load();
  }, [documentId]);

  if (!doc) return null;

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to documents
      </button>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{doc.title}</h1>
          {doc.prompt_text && (
            <p className="text-sm text-muted-foreground mt-1 italic">"{doc.prompt_text}"</p>
          )}
        </div>
        <Badge variant="outline" className={STATUS_COLOR[doc.status] || ''}>
          {STATUS_LABEL[doc.status] || doc.status}
        </Badge>
      </div>

      <NewVersionForm documentId={documentId} nextVersionNo={(versions[0]?.version_no || 0) + 1} onCreated={load} />

      <div className="grid lg:grid-cols-[200px_1fr] gap-4">
        {/* Version list */}
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Versions</div>
          {versions.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelectedVersion(v)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-lg border text-sm',
                selectedVersion?.id === v.id ? 'border-primary bg-primary/5' : 'hover:bg-muted',
              )}
            >
              <div className="font-medium">v{v.version_no}</div>
              <div className="text-xs text-muted-foreground">
                {new Date(v.created_at).toLocaleDateString()} · {v.word_count || 0} words
              </div>
            </button>
          ))}
          {versions.length === 0 && (
            <div className="text-xs text-muted-foreground p-2">No versions yet.</div>
          )}
        </div>

        {/* Reader */}
        <div>{selectedVersion && <VersionReader version={selectedVersion} onChanged={load} />}</div>
      </div>
    </div>
  );
}

function NewVersionForm({
  documentId,
  nextVersionNo,
  onCreated,
}: {
  documentId: string;
  nextVersionNo: number;
  onCreated: () => void;
}) {
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!body.trim()) return;
    setSaving(true);
    const wordCount = body.trim().split(/\s+/).length;
    const { error } = await supabase.from('student_document_versions').insert({
      document_id: documentId,
      version_no: nextVersionNo,
      body_text: body,
      word_count: wordCount,
      created_by: 'student',
      status: 'submitted',
    });
    await supabase.from('student_documents_v2').update({ status: 'submitted' }).eq('id', documentId);
    setSaving(false);
    if (error) {
      toast.error('Failed to save version');
      return;
    }
    setBody('');
    onCreated();
    toast.success(`Version ${nextVersionNo} submitted`);
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="text-sm font-medium">Add version {nextVersionNo}</div>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          placeholder="Paste your draft here..."
        />
        <div className="flex justify-end">
          <Button onClick={submit} disabled={saving || !body.trim()} className="gap-2">
            <Upload className="h-4 w-4" /> Submit version
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function VersionReader({ version, onChanged }: { version: any; onChanged: () => void }) {
  const [comments, setComments] = useState<any[]>([]);
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);

  const loadComments = async () => {
    const { data } = await supabase
      .from('student_document_comments')
      .select('*')
      .eq('version_id', version.id)
      .order('created_at');
    setComments(data || []);
  };

  useEffect(() => {
    loadComments();
    setSelection(null);
    setDraft('');
  }, [version.id]);

  const text = version.body_text || '';

  const onSelect = (e: React.SyntheticEvent<HTMLDivElement>) => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      setSelection(null);
      return;
    }
    const root = e.currentTarget;
    const range = sel.getRangeAt(0);
    if (!root.contains(range.commonAncestorContainer)) return;
    const preRange = range.cloneRange();
    preRange.selectNodeContents(root);
    preRange.setEnd(range.startContainer, range.startOffset);
    const start = preRange.toString().length;
    const end = start + range.toString().length;
    if (end > start) setSelection({ start, end });
  };

  const postComment = async () => {
    if (!draft.trim()) return;
    setPosting(true);
    const { error } = await supabase.from('student_document_comments').insert({
      version_id: version.id,
      anchor_start: selection?.start ?? null,
      anchor_end: selection?.end ?? null,
      author: 'student',
      body: draft.trim(),
    });
    setPosting(false);
    if (error) {
      toast.error('Failed to post');
      return;
    }
    setDraft('');
    setSelection(null);
    loadComments();
  };

  const resolve = async (id: string) => {
    await supabase.from('student_document_comments').update({ resolved_at: new Date().toISOString() }).eq('id', id);
    loadComments();
  };

  // Render text with highlighted comment spans
  const segments = useMemo(() => {
    const anchored = comments.filter((c) => c.anchor_start != null && c.anchor_end != null && !c.resolved_at);
    if (anchored.length === 0) return [{ text, highlighted: false }];
    const points = new Set<number>([0, text.length]);
    anchored.forEach((c) => {
      points.add(c.anchor_start);
      points.add(c.anchor_end);
    });
    const sorted = Array.from(points).sort((a, b) => a - b);
    const out: { text: string; highlighted: boolean }[] = [];
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i];
      const b = sorted[i + 1];
      const segment = text.slice(a, b);
      const isHi = anchored.some((c) => c.anchor_start <= a && c.anchor_end >= b);
      out.push({ text: segment, highlighted: isHi });
    }
    return out;
  }, [text, comments]);

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="p-5">
          <div
            className="whitespace-pre-wrap text-[15px] leading-relaxed select-text"
            onMouseUp={onSelect}
          >
            {segments.map((s, i) =>
              s.highlighted ? (
                <mark key={i} className="bg-amber-200/60 dark:bg-amber-500/30 px-0.5 rounded-sm">
                  {s.text}
                </mark>
              ) : (
                <span key={i}>{s.text}</span>
              ),
            )}
          </div>
        </CardContent>
      </Card>

      {selection && (
        <Card className="border-primary">
          <CardContent className="p-3 space-y-2">
            <div className="text-xs text-muted-foreground">
              Commenting on: "{text.slice(selection.start, selection.end).slice(0, 80)}..."
            </div>
            <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} placeholder="Your comment..." />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setSelection(null)}>
                Cancel
              </Button>
              <Button size="sm" onClick={postComment} disabled={posting || !draft.trim()}>
                Post comment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {comments.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1">
            <MessageCircle className="h-3 w-3" /> Comments ({comments.length})
          </div>
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
                {c.anchor_start != null && (
                  <div className="text-xs italic text-muted-foreground mb-1">
                    "{(version.body_text || '').slice(c.anchor_start, c.anchor_end).slice(0, 80)}..."
                  </div>
                )}
                <div className="whitespace-pre-wrap">{c.body}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
