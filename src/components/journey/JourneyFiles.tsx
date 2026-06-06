import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, Download, Trash2, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const BUCKET = 'student-portal-docs';

const FOLDERS = [
  { value: 'application', label: 'Application docs' },
  { value: 'essays', label: 'Essays & writing' },
  { value: 'transcripts', label: 'Transcripts' },
  { value: 'recommendations', label: 'Recommendations' },
  { value: 'financial', label: 'Financial aid' },
  { value: 'acceptance', label: 'Acceptance letters' },
  { value: 'other', label: 'Other' },
];

const REVIEW_BADGE: Record<string, { label: string; cls: string }> = {
  none: { label: 'Shared', cls: 'bg-muted text-muted-foreground' },
  requested: { label: 'Requested', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  approved: { label: 'Approved', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
};

export function JourneyFiles({
  studentId,
  mode = 'student',
}: {
  studentId: string;
  mode?: 'student' | 'counselor';
}) {
  const [files, setFiles] = useState<any[]>([]);
  const [activeFolder, setActiveFolder] = useState<string>('all');
  const [uploadingFolder, setUploadingFolder] = useState<string>('other');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data } = await supabase
      .from('student_documents_v2')
      .select('*')
      .eq('student_id', studentId)
      .eq('kind', 'file')
      .order('updated_at', { ascending: false });
    setFiles(data || []);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`portal-files-${studentId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'student_documents_v2', filter: `student_id=eq.${studentId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const upload = async (file: File) => {
    setBusy(true);
    try {
      const safe = file.name.replace(/[^\w.\-]+/g, '_');
      const path = `${studentId}/${Date.now()}-${safe}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file);
      if (upErr) throw upErr;
      const { error: insErr } = await supabase.from('student_documents_v2').insert({
        student_id: studentId,
        title: file.name,
        kind: 'file',
        folder: uploadingFolder,
        file_path: path,
        uploaded_by: mode,
        review_status: 'none',
        status: 'submitted',
      });
      if (insErr) throw insErr;
      toast.success('File uploaded');
    } catch (e: any) {
      toast.error(e.message || 'Upload failed');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const download = async (f: any) => {
    if (!f.file_path) return;
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(f.file_path, 60);
    if (error || !data) {
      toast.error('Could not open file');
      return;
    }
    window.open(data.signedUrl, '_blank');
  };

  const remove = async (f: any) => {
    if (!confirm(`Delete ${f.title}?`)) return;
    if (f.file_path) await supabase.storage.from(BUCKET).remove([f.file_path]);
    await supabase.from('student_documents_v2').delete().eq('id', f.id);
    toast.success('Deleted');
  };

  const approve = async (f: any) => {
    await supabase.from('student_documents_v2').update({ review_status: 'approved' }).eq('id', f.id);
    toast.success('Approved');
  };

  const filtered = activeFolder === 'all' ? files : files.filter((f) => (f.folder || 'other') === activeFolder);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">File exchange</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Upload transcripts, recommendations, financial forms, acceptance letters — anything you share with your{' '}
            {mode === 'student' ? 'counselor' : 'student'}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={uploadingFolder} onValueChange={setUploadingFolder}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] overflow-y-auto">
              {FOLDERS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => inputRef.current?.click()} disabled={busy} className="gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload
          </Button>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
            }}
          />
        </div>
      </div>

      {/* Folder tabs */}
      <div className="flex gap-1 flex-wrap">
        <FolderChip active={activeFolder === 'all'} onClick={() => setActiveFolder('all')} label={`All (${files.length})`} />
        {FOLDERS.map((f) => {
          const count = files.filter((x) => (x.folder || 'other') === f.value).length;
          if (count === 0) return null;
          return (
            <FolderChip
              key={f.value}
              active={activeFolder === f.value}
              onClick={() => setActiveFolder(f.value)}
              label={`${f.label} (${count})`}
            />
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground text-center">
            No files in this folder yet. Pick a folder and click Upload.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((f) => {
            const badge = REVIEW_BADGE[f.review_status || 'none'];
            return (
              <Card key={f.id}>
                <CardContent className="p-3 flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{f.title}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span className="capitalize">{(f.folder || 'other').replace('_', ' ')}</span>
                      <span>·</span>
                      <span>by {f.uploaded_by || 'unknown'}</span>
                      <span>·</span>
                      <Clock className="h-3 w-3" /> {new Date(f.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant="outline" className={badge.cls}>{badge.label}</Badge>
                  <Button size="sm" variant="ghost" onClick={() => download(f)} title="Download">
                    <Download className="h-4 w-4" />
                  </Button>
                  {mode === 'counselor' && f.review_status !== 'approved' && (
                    <Button size="sm" variant="ghost" onClick={() => approve(f)} title="Approve">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => remove(f)} title="Delete">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FolderChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
        active ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted',
      )}
    >
      {label}
    </button>
  );
}
