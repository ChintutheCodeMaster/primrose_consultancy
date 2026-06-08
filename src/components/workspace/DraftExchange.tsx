import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { File, Upload, ExternalLink, Loader2, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/hooks/use-toast';

type Doc = {
  id: string;
  title: string;
  kind?: string | null;
  folder?: string | null;
  review_status?: string | null;
  uploaded_by?: string | null;
  updated_at?: string | null;
  latestVersion?: {
    id: string;
    version_no: number;
    file_url?: string | null;
    body_text?: string | null;
    word_count?: number | null;
    created_at: string;
    created_by?: string | null;
  };
};

export function DraftExchange({ studentId, side = 'consultant' }: { studentId: string; side?: 'consultant' | 'student' }) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const load = async () => {
    setLoading(true);
    const { data: docsData } = await supabase
      .from('student_documents_v2')
      .select('id, title, kind, folder, review_status, uploaded_by, updated_at')
      .eq('student_id', studentId)
      .order('updated_at', { ascending: false });
    if (!docsData) { setDocs([]); setLoading(false); return; }
    const ids = docsData.map((d) => d.id);
    const { data: versions } = ids.length
      ? await supabase
          .from('student_document_versions')
          .select('id, document_id, version_no, file_url, body_text, word_count, created_at, created_by')
          .in('document_id', ids)
          .order('version_no', { ascending: false })
      : { data: [] as any[] };
    const latestMap = new Map<string, any>();
    (versions || []).forEach((v: any) => { if (!latestMap.has(v.document_id)) latestMap.set(v.document_id, v); });
    setDocs(docsData.map((d) => ({ ...d, latestVersion: latestMap.get(d.id) })));
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [studentId]);

  const upload = async (file: File, title?: string) => {
    setUploading(true);
    try {
      const cleanTitle = (title || file.name).replace(/\.[^.]+$/, '');
      const path = `${studentId}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from('student-documents').upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('student-documents').getPublicUrl(path);

      // Create or find document
      const { data: doc, error: docErr } = await supabase
        .from('student_documents_v2')
        .insert({
          student_id: studentId,
          title: cleanTitle,
          kind: 'essay',
          folder: 'drafts',
          file_path: path,
          uploaded_by: side,
          review_status: side === 'student' ? 'awaiting_review' : 'returned',
        })
        .select('id')
        .single();
      if (docErr) throw docErr;

      await supabase.from('student_document_versions').insert({
        document_id: doc.id,
        version_no: 1,
        file_url: urlData.publicUrl,
        file_mime: file.type,
        status: 'draft',
        created_by: side,
      });

      toast({ title: 'Draft uploaded', description: cleanTitle });
      setNewTitle('');
      await load();
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e?.message || 'Try again', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const addNewVersion = async (docId: string, file: File) => {
    setUploading(true);
    try {
      const path = `${studentId}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from('student-documents').upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('student-documents').getPublicUrl(path);
      const { data: vs } = await supabase
        .from('student_document_versions')
        .select('version_no').eq('document_id', docId).order('version_no', { ascending: false }).limit(1);
      const next = ((vs?.[0]?.version_no) ?? 0) + 1;
      await supabase.from('student_document_versions').insert({
        document_id: docId, version_no: next, file_url: urlData.publicUrl, file_mime: file.type,
        status: 'draft', created_by: side,
      });
      await supabase.from('student_documents_v2').update({
        updated_at: new Date().toISOString(),
        review_status: side === 'student' ? 'awaiting_review' : 'returned',
      }).eq('id', docId);
      toast({ title: 'New version uploaded', description: `v${next}` });
      await load();
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e?.message || 'Try again', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-card p-5 sm:p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
          <FileText className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">Draft exchange</h3>
          <p className="text-xs text-muted-foreground">Upload .docx / .pdf drafts. Every upload becomes a new version.</p>
        </div>
      </div>

      {/* New upload */}
      <div className="rounded-xl border border-dashed bg-muted/30 p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <Label htmlFor="dx-title">New essay title (optional)</Label>
            <Input id="dx-title" placeholder="e.g. Common App Personal Statement" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          </div>
          <div>
            <input
              id="dx-file" type="file" className="hidden"
              accept=".pdf,.doc,.docx,.txt,.rtf,.odt"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, newTitle); e.currentTarget.value = ''; }}
            />
            <Button asChild disabled={uploading} className="w-full sm:w-auto gap-2">
              <label htmlFor="dx-file" className="cursor-pointer">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload draft
              </label>
            </Button>
          </div>
        </div>
      </div>

      {/* Doc list */}
      <div className="mt-4 space-y-2">
        {loading ? (
          <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading drafts…
          </div>
        ) : docs.length === 0 ? (
          <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
            No drafts yet. Upload the first one above.
          </p>
        ) : (
          docs.map((d) => (
            <div key={d.id} className="rounded-lg border bg-background p-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <File className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{d.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.latestVersion ? `v${d.latestVersion.version_no} · ${formatDistanceToNow(new Date(d.latestVersion.created_at), { addSuffix: true })}` : 'No versions'}
                      {d.review_status && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider">{d.review_status.replace('_', ' ')}</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {d.latestVersion?.file_url && (
                    <Button asChild variant="outline" size="sm">
                      <a href={d.latestVersion.file_url} target="_blank" rel="noreferrer" className="gap-1">
                        Open <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                  <input
                    id={`dx-v-${d.id}`} type="file" className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.rtf,.odt"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) addNewVersion(d.id, f); e.currentTarget.value = ''; }}
                  />
                  <Button asChild variant="outline" size="sm" disabled={uploading}>
                    <label htmlFor={`dx-v-${d.id}`} className="cursor-pointer gap-1">
                      <Upload className="h-3 w-3" /> New version
                    </label>
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
