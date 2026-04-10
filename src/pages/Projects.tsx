import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Pencil, Trash2, FolderKanban, ExternalLink, FileText, ChevronDown, Phone, Mail, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { openExternalFile } from '@/lib/file-open';

// ── Types ──

interface Collaboration {
  id: string;
  name: string;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  category: string | null;
  notes: string | null;
  created_at: string;
}

interface Project {
  id: string;
  collaboration_id: string | null;
  name: string;
  description: string | null;
  payment_direction: string;
  amount: number | null;
  net_amount: number | null;
  payment_date: string | null;
  invoice_date: string | null;
  payment_request_date: string | null;
  status: string;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  category: string | null;
  file_url: string | null;
  storage_bucket: string | null;
  storage_path: string | null;
  notes: string | null;
  payment_notes: string | null;
  created_at: string;
}

interface CollabFormData {
  name: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  category: string;
  notes: string;
}

interface ProjectFormData {
  name: string;
  description: string;
  payment_direction: string;
  amount: string;
  net_amount: string;
  payment_date: string;
  invoice_date: string;
  payment_request_date: string;
  status: string;
  category: string;
  notes: string;
  payment_notes: string;
}

const initialCollabForm: CollabFormData = { name: '', contact_name: '', contact_phone: '', contact_email: '', category: '', notes: '' };
const initialProjectForm: ProjectFormData = { name: '', description: '', payment_direction: 'income', amount: '', net_amount: '', payment_date: '', invoice_date: '', payment_request_date: '', status: 'active', category: '', notes: '', payment_notes: '' };

const statusLabels: Record<string, string> = { active: 'פעיל', completed: 'הושלם', pending_payment: 'ממתין לתשלום', pending_invoice: 'ממתין לחשבונית' };
const statusColors: Record<string, string> = { active: 'bg-primary/20 text-primary', completed: 'bg-green-100 text-green-700', pending_payment: 'bg-yellow-100 text-yellow-700', pending_invoice: 'bg-orange-100 text-orange-700' };
const directionLabels: Record<string, string> = { income: 'הכנסה', expense: 'הוצאה' };

// ── Main Component ──

export default function Projects() {
  const queryClient = useQueryClient();
  const [isAddCollabOpen, setIsAddCollabOpen] = useState(false);
  const [editingCollab, setEditingCollab] = useState<Collaboration | null>(null);
  const [collabForm, setCollabForm] = useState<CollabFormData>(initialCollabForm);

  const [addingProjectForCollabId, setAddingProjectForCollabId] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectForm, setProjectForm] = useState<ProjectFormData>(initialProjectForm);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [openCollabs, setOpenCollabs] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // ── Queries ──

  const { data: collaborations = [], isLoading: loadingCollabs } = useQuery({
    queryKey: ['collaborations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('collaborations').select('*').order('name');
      if (error) throw error;
      return data as Collaboration[];
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Project[];
    },
  });

  const projectsByCollab = (collabId: string) => projects.filter(p => p.collaboration_id === collabId);

  // ── Collab Mutations ──

  const addCollabMutation = useMutation({
    mutationFn: async (data: CollabFormData) => {
      const { error } = await supabase.from('collaborations').insert({
        name: data.name,
        contact_name: data.contact_name || null,
        contact_phone: data.contact_phone || null,
        contact_email: data.contact_email || null,
        category: data.category || null,
        notes: data.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborations'] });
      toast.success('גוף שיתוף פעולה נוסף');
      closeCollabDialog();
    },
    onError: () => toast.error('שגיאה בהוספה'),
  });

  const updateCollabMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CollabFormData }) => {
      const { error } = await supabase.from('collaborations').update({
        name: data.name,
        contact_name: data.contact_name || null,
        contact_phone: data.contact_phone || null,
        contact_email: data.contact_email || null,
        category: data.category || null,
        notes: data.notes || null,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborations'] });
      toast.success('עודכן בהצלחה');
      closeCollabDialog();
    },
    onError: () => toast.error('שגיאה בעדכון'),
  });

  const deleteCollabMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('collaborations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborations'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('נמחק בהצלחה');
    },
    onError: () => toast.error('שגיאה במחיקה'),
  });

  // ── Project Mutations ──

  const addProjectMutation = useMutation({
    mutationFn: async ({ collabId, data }: { collabId: string; data: ProjectFormData }) => {
      const { error } = await supabase.from('projects').insert({
        collaboration_id: collabId,
        name: data.name,
        description: data.description || null,
        payment_direction: data.payment_direction,
        amount: data.amount ? parseFloat(data.amount) : null,
        net_amount: data.net_amount ? parseFloat(data.net_amount) : null,
        payment_date: data.payment_date || null,
        invoice_date: data.invoice_date || null,
        payment_request_date: data.payment_request_date || null,
        status: data.status,
        category: data.category || null,
        storage_bucket: filePath ? 'project-files' : null,
        storage_path: filePath || null,
        notes: data.notes || null,
        payment_notes: data.payment_notes || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('פרויקט נוסף');
      closeProjectDialog();
    },
    onError: () => toast.error('שגיאה בהוספת פרויקט'),
  });

  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, data, currentProject }: { id: string; data: ProjectFormData; currentProject: Project }) => {
      const nextPath = filePath === ''
        ? null
        : (filePath || normalizeStoragePath(currentProject.storage_path) || normalizeStoragePath(currentProject.file_url));
      const { error } = await supabase.from('projects').update({
        name: data.name,
        description: data.description || null,
        payment_direction: data.payment_direction,
        amount: data.amount ? parseFloat(data.amount) : null,
        net_amount: data.net_amount ? parseFloat(data.net_amount) : null,
        payment_date: data.payment_date || null,
        invoice_date: data.invoice_date || null,
        payment_request_date: data.payment_request_date || null,
        status: data.status,
        category: data.category || null,
        file_url: null,
        storage_bucket: nextPath ? (currentProject.storage_bucket || 'project-files') : null,
        storage_path: nextPath,
        notes: data.notes || null,
        payment_notes: data.payment_notes || null,
      } as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('פרויקט עודכן');
      closeProjectDialog();
    },
    onError: () => toast.error('שגיאה בעדכון'),
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('פרויקט נמחק');
    },
    onError: () => toast.error('שגיאה במחיקה'),
  });

  // ── Handlers ──

  const toggleCollab = (id: string) => {
    setOpenCollabs(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const closeCollabDialog = () => { setIsAddCollabOpen(false); setEditingCollab(null); setCollabForm(initialCollabForm); };
  const closeProjectDialog = () => { setAddingProjectForCollabId(null); setEditingProject(null); setProjectForm(initialProjectForm); setFilePath(null); };

  const openEditCollab = (c: Collaboration) => {
    setEditingCollab(c);
    setCollabForm({ name: c.name, contact_name: c.contact_name || '', contact_phone: c.contact_phone || '', contact_email: c.contact_email || '', category: c.category || '', notes: c.notes || '' });
  };

  const safeDecode = (value: string) => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };

  const normalizeStoragePath = (value?: string | null) => {
    if (!value) return null;

    const trimmed = value.trim();
    if (!trimmed) return null;

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return safeDecode(trimmed).replace(/^project-files\//, '').split('?')[0].replace(/^\/+/, '');
    }

    try {
      const parsed = new URL(trimmed);
      const knownMarkers = [
        '/storage/v1/object/sign/project-files/',
        '/storage/v1/object/public/project-files/',
        '/storage/v1/object/authenticated/project-files/',
        '/project-files/',
      ];

      for (const marker of knownMarkers) {
        const markerIndex = parsed.pathname.indexOf(marker);
        if (markerIndex !== -1) {
          const rawPath = parsed.pathname.slice(markerIndex + marker.length);
          return safeDecode(rawPath).split('?')[0].replace(/^\/+/, '');
        }
      }

      return null;
    } catch {
      return null;
    }
  };

  const getProjectPathCandidates = (project: Project) => {
    const candidates = new Set<string>();
    const add = (raw?: string | null) => {
      const normalized = normalizeStoragePath(raw);
      if (!normalized) return;
      candidates.add(normalized);
      const lastPart = normalized.split('/').pop();
      if (lastPart && lastPart !== normalized) {
        candidates.add(lastPart);
      }
    };

    add(project.storage_path);
    add(project.file_url);

    return Array.from(candidates);
  };

  const openEditProject = (p: Project) => {
    setEditingProject(p);
    setProjectForm({ name: p.name, description: p.description || '', payment_direction: p.payment_direction, amount: p.amount?.toString() || '', net_amount: (p as any).net_amount?.toString() || '', payment_date: p.payment_date || '', invoice_date: p.invoice_date || '', payment_request_date: p.payment_request_date || '', status: p.status, category: p.category || '', notes: p.notes || '', payment_notes: p.payment_notes || '' });
    setFilePath(normalizeStoragePath(p.storage_path) || normalizeStoragePath(p.file_url));
  };

  const handleCollabSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collabForm.name.trim()) return;
    if (editingCollab) updateCollabMutation.mutate({ id: editingCollab.id, data: collabForm });
    else addCollabMutation.mutate(collabForm);
  };

  const handleProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.name.trim()) return;
    if (editingProject) updateProjectMutation.mutate({ id: editingProject.id, data: projectForm, currentProject: editingProject });
    else if (addingProjectForCollabId) addProjectMutation.mutate({ collabId: addingProjectForCollabId, data: projectForm });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    try {
      const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileName = `${Date.now()}-${sanitized}`;
      const { error } = await supabase.storage.from('project-files').upload(fileName, file, { contentType: file.type, cacheControl: '3600' });
      if (error) throw error;
      setFilePath(fileName);
      toast.success('קובץ הועלה');
    } catch { toast.error('שגיאה בהעלאת קובץ'); }
    finally { setUploadingFile(false); }
  };

  const openProjectFile = async (project: Project) => {
    const bucket = project.storage_bucket || 'project-files';
    const candidates = getProjectPathCandidates(project);
    const directUrl = project.file_url?.trim();
    const absoluteUrl = directUrl && /^https?:\/\//i.test(directUrl) ? directUrl : null;

    if (candidates.length === 0 && !absoluteUrl) {
      toast.error('לא נמצא נתיב קובץ לפרויקט הזה');
      return;
    }

    try {
      if (absoluteUrl) {
        await openExternalFile(absoluteUrl, project.name);
        return;
      }

      for (const path of candidates) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        if (!data?.publicUrl) continue;

        await openExternalFile(data.publicUrl, path.split('/').pop() || project.name);
        return;
      }

      toast.error('לא הצלחנו לפתוח את הקובץ');
    } catch (error) {
      console.error('Failed to open project file', error);
      toast.error('אירעה שגיאה בפתיחת הקובץ. נסי שוב.');
    }
  };

  // ── Collab Form ──
  const collabFormContent = (
    <form onSubmit={handleCollabSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>שם הגוף *</Label>
          <Input value={collabForm.name} onChange={e => setCollabForm(p => ({ ...p, name: e.target.value }))} required />
        </div>
        <div>
          <Label>קטגוריה</Label>
          <Input value={collabForm.category} onChange={e => setCollabForm(p => ({ ...p, category: e.target.value }))} placeholder="שיווק, תרגום, אירועים..." />
        </div>
        <div />
        <div className="col-span-2 border-t pt-3">
          <p className="text-sm font-medium text-muted-foreground mb-2">איש קשר</p>
        </div>
        <div>
          <Label>שם</Label>
          <Input value={collabForm.contact_name} onChange={e => setCollabForm(p => ({ ...p, contact_name: e.target.value }))} />
        </div>
        <div>
          <Label>טלפון</Label>
          <Input value={collabForm.contact_phone} onChange={e => setCollabForm(p => ({ ...p, contact_phone: e.target.value }))} dir="ltr" />
        </div>
        <div className="col-span-2">
          <Label>מייל</Label>
          <Input value={collabForm.contact_email} onChange={e => setCollabForm(p => ({ ...p, contact_email: e.target.value }))} dir="ltr" />
        </div>
        <div className="col-span-2">
          <Label>הערות כלליות</Label>
          <Textarea value={collabForm.notes} onChange={e => setCollabForm(p => ({ ...p, notes: e.target.value }))} rows={2} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={closeCollabDialog}>ביטול</Button>
        <Button type="submit">{editingCollab ? 'עדכן' : 'הוסף'}</Button>
      </div>
    </form>
  );

  // ── Project Form ──
  const projectFormContent = (
    <form onSubmit={handleProjectSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>שם הפרויקט *</Label>
          <Input value={projectForm.name} onChange={e => setProjectForm(p => ({ ...p, name: e.target.value }))} required />
        </div>
        <div className="col-span-2">
          <Label>תיאור</Label>
          <Textarea value={projectForm.description} onChange={e => setProjectForm(p => ({ ...p, description: e.target.value }))} rows={2} />
        </div>
        <div>
          <Label>כיוון תשלום</Label>
          <Select value={projectForm.payment_direction} onValueChange={v => setProjectForm(p => ({ ...p, payment_direction: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="income">הכנסה</SelectItem>
              <SelectItem value="expense">הוצאה</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>סכום</Label>
          <Input type="text" inputMode="decimal" value={projectForm.amount} onChange={e => setProjectForm(p => ({ ...p, amount: e.target.value.replace(/[^0-9.]/g, '') }))} />
          <Input type="text" inputMode="decimal" placeholder="סכום לאחר ניכוי מס (אופציונלי)" value={projectForm.net_amount} onChange={e => setProjectForm(p => ({ ...p, net_amount: e.target.value.replace(/[^0-9.]/g, '') }))} className="mt-1 text-xs h-8" />
        </div>
        <div>
          <Label>מתי נשלחה דרישת תשלום</Label>
          <Input type="date" value={projectForm.payment_request_date} onChange={e => setProjectForm(p => ({ ...p, payment_request_date: e.target.value }))} />
        </div>
        <div>
          <Label>מתי הופקה חשבונית</Label>
          <Input type="date" value={projectForm.invoice_date} onChange={e => setProjectForm(p => ({ ...p, invoice_date: e.target.value }))} />
        </div>
        <div>
          <Label>מתי שולם</Label>
          <Input type="date" value={projectForm.payment_date} onChange={e => setProjectForm(p => ({ ...p, payment_date: e.target.value }))} />
        </div>
        <div>
          <Label>סטטוס</Label>
          <Select value={projectForm.status} onValueChange={v => setProjectForm(p => ({ ...p, status: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">פעיל</SelectItem>
              <SelectItem value="completed">הושלם</SelectItem>
              <SelectItem value="pending_payment">ממתין לתשלום</SelectItem>
              <SelectItem value="pending_invoice">ממתין לחשבונית</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>קטגוריה</Label>
          <Input value={projectForm.category} onChange={e => setProjectForm(p => ({ ...p, category: e.target.value }))} />
        </div>
        <div className="col-span-2">
          <Label>הערות תשלום</Label>
          <Textarea value={projectForm.payment_notes} onChange={e => setProjectForm(p => ({ ...p, payment_notes: e.target.value }))} rows={2} />
        </div>
        <div className="col-span-2">
          <Label>צירוף קובץ (חשבונית / חוזה)</Label>
          <div className="flex items-center gap-2">
            <Input type="file" onChange={handleFileUpload} disabled={uploadingFile} className="flex-1" />
            {filePath && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => openProjectFile({ storage_bucket: 'project-files', storage_path: filePath, file_url: null } as Project)}
                  title="צפייה בקובץ"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setFilePath('')}
                  title="הסרת קובץ"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
          {filePath && <p className="text-xs text-muted-foreground mt-1">קובץ מצורף: {filePath.replace(/^\d+-/, '')}</p>}
          {uploadingFile && <p className="text-xs text-muted-foreground mt-1">מעלה...</p>}
        </div>
        <div className="col-span-2">
          <Label>הערות</Label>
          <Textarea value={projectForm.notes} onChange={e => setProjectForm(p => ({ ...p, notes: e.target.value }))} rows={2} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={closeProjectDialog}>ביטול</Button>
        <Button type="submit">{editingProject ? 'עדכן' : 'הוסף'}</Button>
      </div>
    </form>
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">פרויקטים ושיתופי פעולה ({collaborations.length})</h1>
            <p className="text-muted-foreground mt-1">ניהול גופי שיתוף פעולה והפרויקטים שלהם</p>
          </div>
          <Dialog open={isAddCollabOpen} onOpenChange={open => { setIsAddCollabOpen(open); if (!open) closeCollabDialog(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" />הוסף גוף שת״פ</Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>גוף שיתוף פעולה חדש</DialogTitle></DialogHeader>
              {collabFormContent}
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative">
          <Input
            placeholder="חיפוש לפי שם גוף שת״פ, פרויקט, איש קשר..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Content */}
        {loadingCollabs ? (
          <div className="text-center py-12 text-muted-foreground">טוען...</div>
        ) : collaborations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderKanban className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">אין גופי שיתוף פעולה</p>
              <p className="text-sm text-muted-foreground/70">הוסיפי גוף ראשון כדי להתחיל</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {collaborations.filter(collab => {
              if (!searchQuery.trim()) return true;
              const q = searchQuery.trim().toLowerCase();
              const collabProjects = projectsByCollab(collab.id);
              const collabMatch = collab.name.toLowerCase().includes(q) ||
                (collab.contact_name || '').toLowerCase().includes(q) ||
                (collab.contact_email || '').toLowerCase().includes(q) ||
                (collab.contact_phone || '').toLowerCase().includes(q) ||
                (collab.category || '').toLowerCase().includes(q);
              const projectMatch = collabProjects.some(p =>
                p.name.toLowerCase().includes(q) ||
                (p.description || '').toLowerCase().includes(q) ||
                (p.notes || '').toLowerCase().includes(q)
              );
              return collabMatch || projectMatch;
            }).map(collab => {
              const collabProjects = projectsByCollab(collab.id);
              const isOpen = openCollabs.has(collab.id);
              const totalIncome = collabProjects.filter(p => p.payment_direction === 'income').reduce((sum, p) => sum + (p.amount || 0), 0);
              const totalExpense = collabProjects.filter(p => p.payment_direction === 'expense').reduce((sum, p) => sum + (p.amount || 0), 0);
              const net = totalIncome - totalExpense;
              const totalNetAmount = collabProjects.filter(p => p.payment_direction === 'income').reduce((sum, p) => sum + (p.net_amount || 0), 0);
              const pendingPaymentCount = collabProjects.filter(p => p.status === 'pending_payment').length;
              return (
                <Card key={collab.id}>
                  <Collapsible open={isOpen} onOpenChange={() => toggleCollab(collab.id)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CollapsibleTrigger className="flex items-center gap-3 flex-1 text-right">
                          <ChevronDown className={cn('h-5 w-5 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                              <Building2 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-lg flex items-center gap-2">
                                {collab.name}
                                {pendingPaymentCount > 0 && (
                                  <span className="inline-flex h-2 w-2 rounded-full bg-warning" title={`${pendingPaymentCount} ממתינים לתשלום`} />
                                )}
                              </CardTitle>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                                {collab.category && <span>{collab.category}</span>}
                                <span>{collabProjects.length} פרויקטים</span>
                                {collabProjects.length > 0 && (
                                  <>
                                    {totalExpense > 0 && totalIncome > 0 && <span className="text-red-600">-₪{totalExpense.toLocaleString()}</span>}
                                    <span className={cn('font-medium', net >= 0 ? 'text-green-700' : 'text-red-700')}>
                                      {totalIncome > 0 && totalExpense === 0 ? 'הכנסות כולל' : totalExpense > 0 && totalIncome === 0 ? 'הוצאות כולל' : 'הכנסות כולל'}: ₪{Math.abs(net).toLocaleString()}
                                    </span>
                                    {totalNetAmount > 0 && (
                                      <span className="text-muted-foreground">
                                        הכנסות לאחר ניכוי: ₪{totalNetAmount.toLocaleString()}
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setAddingProjectForCollabId(collab.id); if (!isOpen) toggleCollab(collab.id); }}>
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEditCollab(collab); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); if (confirm('למחוק את הגוף וכל הפרויקטים שלו?')) deleteCollabMutation.mutate(collab.id); }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {/* Contact info row */}
                      {(collab.contact_name || collab.contact_phone || collab.contact_email) && (
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mr-[4.5rem] mt-1">
                          {collab.contact_name && <span>{collab.contact_name}</span>}
                          {collab.contact_phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /><span dir="ltr">{collab.contact_phone}</span></span>}
                          {collab.contact_email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /><span dir="ltr">{collab.contact_email}</span></span>}
                        </div>
                      )}
                    </CardHeader>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        {collabProjects.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">אין פרויקטים עדיין</p>
                        ) : (
                          <div className="overflow-x-auto border rounded-lg">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-right">פרויקט</TableHead>
                                  <TableHead className="text-right">כיוון</TableHead>
                                  <TableHead className="text-right">סכום</TableHead>
                                  <TableHead className="text-right">דרישת תשלום</TableHead>
                                  <TableHead className="text-right">חשבונית</TableHead>
                                  <TableHead className="text-right">מתי שולם</TableHead>
                                  <TableHead className="text-right">סטטוס</TableHead>
                                  <TableHead className="text-right">הערות תשלום</TableHead>
                                  <TableHead className="text-right">הערות</TableHead>
                                  <TableHead className="text-right">קובץ</TableHead>
                                  <TableHead className="text-right">פעולות</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {collabProjects.map(project => (
                                  <TableRow key={project.id}>
                                    <TableCell className="font-medium">
                                      <div>
                                        {project.name}
                                        {project.description && <p className="text-xs text-muted-foreground mt-0.5 max-w-[180px] truncate">{project.description}</p>}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className={project.payment_direction === 'income' ? 'border-green-300 text-green-700' : 'border-red-300 text-red-700'}>
                                        {directionLabels[project.payment_direction] || project.payment_direction}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <div>
                                        {project.amount != null ? `₪${project.amount.toLocaleString()}` : '-'}
                                        {(project as any).net_amount != null && (
                                          <p className="text-xs text-muted-foreground">נטו: ₪{(project as any).net_amount.toLocaleString()}</p>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>{project.payment_request_date ? format(new Date(project.payment_request_date), 'dd/MM/yyyy') : '-'}</TableCell>
                                    <TableCell>{project.invoice_date ? format(new Date(project.invoice_date), 'dd/MM/yyyy') : '-'}</TableCell>
                                    <TableCell>{project.payment_date ? format(new Date(project.payment_date), 'dd/MM/yyyy') : '-'}</TableCell>
                                    <TableCell>
                                      <Badge className={statusColors[project.status] || ''}>{statusLabels[project.status] || project.status}</Badge>
                                    </TableCell>
                                    <TableCell><span className="text-sm max-w-[120px] truncate block">{project.payment_notes || '-'}</span></TableCell>
                                    <TableCell><span className="text-sm max-w-[120px] truncate block">{project.notes || '-'}</span></TableCell>
                                     <TableCell>
                                      {(project.storage_path || project.file_url) ? (
                                        <button type="button" onClick={() => openProjectFile(project)}>
                                          <FileText className="h-4 w-4 text-primary hover:text-primary/80" />
                                        </button>
                                      ) : '-'}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditProject(project)}>
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { if (confirm('למחוק?')) deleteProjectMutation.mutate(project.id); }}>
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}
          </div>
        )}

        {/* Edit Collab Dialog */}
        <Dialog open={!!editingCollab} onOpenChange={open => !open && closeCollabDialog()}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>עריכת גוף שיתוף פעולה</DialogTitle></DialogHeader>
            {collabFormContent}
          </DialogContent>
        </Dialog>

        {/* Add Project Dialog */}
        <Dialog open={!!addingProjectForCollabId} onOpenChange={open => !open && closeProjectDialog()}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>פרויקט חדש</DialogTitle></DialogHeader>
            {projectFormContent}
          </DialogContent>
        </Dialog>

        {/* Edit Project Dialog */}
        <Dialog open={!!editingProject} onOpenChange={open => !open && closeProjectDialog()}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>עריכת פרויקט</DialogTitle></DialogHeader>
            {projectFormContent}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
