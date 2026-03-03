import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, FolderKanban, Upload, ExternalLink, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Project {
  id: string;
  name: string;
  description: string | null;
  payment_direction: string;
  amount: number | null;
  payment_date: string | null;
  invoice_date: string | null;
  status: string;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  category: string | null;
  file_url: string | null;
  notes: string | null;
  created_at: string;
}

interface ProjectFormData {
  name: string;
  description: string;
  payment_direction: string;
  amount: string;
  payment_date: string;
  invoice_date: string;
  status: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  category: string;
  notes: string;
}

const initialFormData: ProjectFormData = {
  name: '',
  description: '',
  payment_direction: 'income',
  amount: '',
  payment_date: '',
  invoice_date: '',
  status: 'active',
  contact_name: '',
  contact_phone: '',
  contact_email: '',
  category: '',
  notes: '',
};

const statusLabels: Record<string, string> = {
  active: 'פעיל',
  completed: 'הושלם',
  pending_payment: 'ממתין לתשלום',
  pending_invoice: 'ממתין לחשבונית',
};

const statusColors: Record<string, string> = {
  active: 'bg-primary/20 text-primary',
  completed: 'bg-green-100 text-green-700',
  pending_payment: 'bg-yellow-100 text-yellow-700',
  pending_invoice: 'bg-orange-100 text-orange-700',
};

const directionLabels: Record<string, string> = {
  income: 'הכנסה',
  expense: 'הוצאה',
};

export default function Projects() {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>(initialFormData);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Project[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      const { error } = await supabase.from('projects').insert({
        name: data.name,
        description: data.description || null,
        payment_direction: data.payment_direction,
        amount: data.amount ? parseFloat(data.amount) : null,
        payment_date: data.payment_date || null,
        invoice_date: data.invoice_date || null,
        status: data.status,
        contact_name: data.contact_name || null,
        contact_phone: data.contact_phone || null,
        contact_email: data.contact_email || null,
        category: data.category || null,
        file_url: fileUrl,
        notes: data.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('פרויקט נוסף בהצלחה');
      closeDialog();
    },
    onError: () => toast.error('שגיאה בהוספת פרויקט'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProjectFormData }) => {
      const { error } = await supabase.from('projects').update({
        name: data.name,
        description: data.description || null,
        payment_direction: data.payment_direction,
        amount: data.amount ? parseFloat(data.amount) : null,
        payment_date: data.payment_date || null,
        invoice_date: data.invoice_date || null,
        status: data.status,
        contact_name: data.contact_name || null,
        contact_phone: data.contact_phone || null,
        contact_email: data.contact_email || null,
        category: data.category || null,
        file_url: fileUrl,
        notes: data.notes || null,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('פרויקט עודכן בהצלחה');
      closeDialog();
    },
    onError: () => toast.error('שגיאה בעדכון פרויקט'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('פרויקט נמחק');
    },
    onError: () => toast.error('שגיאה במחיקת פרויקט'),
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('project-files').getPublicUrl(fileName);
      setFileUrl(urlData.publicUrl);
      toast.success('קובץ הועלה בהצלחה');
    } catch {
      toast.error('שגיאה בהעלאת קובץ');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    if (editingProject) {
      updateMutation.mutate({ id: editingProject.id, data: formData });
    } else {
      addMutation.mutate(formData);
    }
  };

  const openEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      payment_direction: project.payment_direction,
      amount: project.amount?.toString() || '',
      payment_date: project.payment_date || '',
      invoice_date: project.invoice_date || '',
      status: project.status,
      contact_name: project.contact_name || '',
      contact_phone: project.contact_phone || '',
      contact_email: project.contact_email || '',
      category: project.category || '',
      notes: project.notes || '',
    });
    setFileUrl(project.file_url);
  };

  const closeDialog = () => {
    setIsAddOpen(false);
    setEditingProject(null);
    setFormData(initialFormData);
    setFileUrl(null);
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>שם הפרויקט *</Label>
          <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required />
        </div>
        <div className="col-span-2">
          <Label>תיאור</Label>
          <Textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows={2} />
        </div>
        <div>
          <Label>כיוון תשלום</Label>
          <Select value={formData.payment_direction} onValueChange={v => setFormData(p => ({ ...p, payment_direction: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="income">הכנסה</SelectItem>
              <SelectItem value="expense">הוצאה</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>סכום</Label>
          <Input type="text" inputMode="decimal" value={formData.amount} onChange={e => {
            const v = e.target.value.replace(/[^0-9.]/g, '');
            setFormData(p => ({ ...p, amount: v }));
          }} />
        </div>
        <div>
          <Label>תאריך תשלום</Label>
          <Input type="date" value={formData.payment_date} onChange={e => setFormData(p => ({ ...p, payment_date: e.target.value }))} />
        </div>
        <div>
          <Label>תאריך חשבונית</Label>
          <Input type="date" value={formData.invoice_date} onChange={e => setFormData(p => ({ ...p, invoice_date: e.target.value }))} />
        </div>
        <div>
          <Label>סטטוס</Label>
          <Select value={formData.status} onValueChange={v => setFormData(p => ({ ...p, status: v }))}>
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
          <Input value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))} placeholder="שיווק, תרגום, אירועים..." />
        </div>
        <div className="col-span-2 border-t pt-3">
          <p className="text-sm font-medium text-muted-foreground mb-2">איש קשר</p>
        </div>
        <div>
          <Label>שם</Label>
          <Input value={formData.contact_name} onChange={e => setFormData(p => ({ ...p, contact_name: e.target.value }))} />
        </div>
        <div>
          <Label>טלפון</Label>
          <Input value={formData.contact_phone} onChange={e => setFormData(p => ({ ...p, contact_phone: e.target.value }))} dir="ltr" />
        </div>
        <div className="col-span-2">
          <Label>מייל</Label>
          <Input value={formData.contact_email} onChange={e => setFormData(p => ({ ...p, contact_email: e.target.value }))} dir="ltr" />
        </div>
        <div className="col-span-2">
          <Label>צירוף קובץ (חשבונית / חוזה)</Label>
          <div className="flex items-center gap-2">
            <Input type="file" onChange={handleFileUpload} disabled={uploadingFile} className="flex-1" />
            {fileUrl && (
              <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                <Button type="button" variant="outline" size="icon"><ExternalLink className="h-4 w-4" /></Button>
              </a>
            )}
          </div>
          {uploadingFile && <p className="text-xs text-muted-foreground mt-1">מעלה...</p>}
        </div>
        <div className="col-span-2">
          <Label>הערות</Label>
          <Textarea value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} rows={3} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={closeDialog}>ביטול</Button>
        <Button type="submit">{editingProject ? 'עדכן' : 'הוסף'}</Button>
      </div>
    </form>
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              פרויקטים ושיתופי פעולה ({projects.length})
            </h1>
            <p className="text-muted-foreground mt-1">מעקב אחר פרויקטים, תשלומים וחשבוניות</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={open => { setIsAddOpen(open); if (!open) closeDialog(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" />הוסף פרויקט</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>פרויקט חדש</DialogTitle></DialogHeader>
              {formContent}
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">טוען...</div>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderKanban className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">אין פרויקטים במערכת</p>
              <p className="text-sm text-muted-foreground/70">הוסיפי פרויקט ראשון כדי להתחיל</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">שם</TableHead>
                      <TableHead className="text-right">קטגוריה</TableHead>
                      <TableHead className="text-right">כיוון</TableHead>
                      <TableHead className="text-right">סכום</TableHead>
                      <TableHead className="text-right">תאריך תשלום</TableHead>
                      <TableHead className="text-right">חשבונית</TableHead>
                      <TableHead className="text-right">סטטוס</TableHead>
                      <TableHead className="text-right">איש קשר</TableHead>
                      <TableHead className="text-right">הערות</TableHead>
                      <TableHead className="text-right">קובץ</TableHead>
                      <TableHead className="text-right">פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.map(project => (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">
                          <div>
                            {project.name}
                            {project.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 max-w-[200px] truncate">{project.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{project.category || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={project.payment_direction === 'income' ? 'border-green-300 text-green-700' : 'border-red-300 text-red-700'}>
                            {directionLabels[project.payment_direction] || project.payment_direction}
                          </Badge>
                        </TableCell>
                        <TableCell>{project.amount != null ? `₪${project.amount.toLocaleString()}` : '-'}</TableCell>
                        <TableCell>{project.payment_date ? format(new Date(project.payment_date), 'dd/MM/yyyy') : '-'}</TableCell>
                        <TableCell>{project.invoice_date ? format(new Date(project.invoice_date), 'dd/MM/yyyy') : '-'}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[project.status] || ''}>
                            {statusLabels[project.status] || project.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {project.contact_name ? (
                            <span className="text-sm">{project.contact_name}</span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm max-w-[150px] truncate block">{project.notes || '-'}</span>
                        </TableCell>
                        <TableCell>
                          {project.file_url ? (
                            <a href={project.file_url} target="_blank" rel="noopener noreferrer">
                              <FileText className="h-4 w-4 text-primary hover:text-primary/80" />
                            </a>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(project)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => {
                              if (confirm('למחוק את הפרויקט?')) deleteMutation.mutate(project.id);
                            }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingProject} onOpenChange={open => !open && closeDialog()}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>עריכת פרויקט</DialogTitle></DialogHeader>
            {formContent}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
