import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, UserCircle, Phone, Mail, FileText, Upload, X, Banknote } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Advisor {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  payment_type: string | null;
  payment_amount: number | null;
  payment_notes: string | null;
  contract_url: string | null;
  notes: string | null;
  is_active: boolean | null;
  created_at: string;
}

const initialFormData = {
  name: '',
  email: '',
  phone: '',
  payment_notes: '',
  contract_url: '',
  notes: '',
  is_active: true,
};

export default function Advisors() {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAdvisor, setEditingAdvisor] = useState<Advisor | null>(null);
  const [viewingAdvisor, setViewingAdvisor] = useState<Advisor | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: advisors = [], isLoading } = useQuery({
    queryKey: ['advisors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advisors')
        .select('*')
        .order('is_active', { ascending: false })
        .order('name');
      if (error) throw error;
      return data as Advisor[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('advisors').insert({
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        payment_notes: data.payment_notes || null,
        contract_url: data.contract_url || null,
        notes: data.notes || null,
        is_active: data.is_active,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advisors'] });
      toast.success('יועץ נוסף בהצלחה');
      setIsAddOpen(false);
      setFormData(initialFormData);
    },
    onError: () => toast.error('שגיאה בהוספת יועץ'),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string } & typeof formData) => {
      const { error } = await supabase
        .from('advisors')
        .update({
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          payment_notes: data.payment_notes || null,
          contract_url: data.contract_url || null,
          notes: data.notes || null,
          is_active: data.is_active,
        })
        .eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advisors'] });
      toast.success('יועץ עודכן בהצלחה');
      setEditingAdvisor(null);
      setFormData(initialFormData);
    },
    onError: () => toast.error('שגיאה בעדכון יועץ'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('advisors').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advisors'] });
      toast.success('יועץ נמחק בהצלחה');
    },
    onError: () => toast.error('שגיאה במחיקת יועץ'),
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('advisor-contracts')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('advisor-contracts')
        .getPublicUrl(fileName);

      setFormData({ ...formData, contract_url: publicUrl });
      toast.success('החוזה הועלה בהצלחה');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('שגיאה בהעלאת הקובץ');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingAdvisor) {
      updateMutation.mutate({ id: editingAdvisor.id, ...formData });
    } else {
      addMutation.mutate(formData);
    }
  };

  const openEdit = (advisor: Advisor) => {
    setEditingAdvisor(advisor);
    setFormData({
      name: advisor.name,
      email: advisor.email || '',
      phone: advisor.phone || '',
      payment_notes: advisor.payment_notes || '',
      contract_url: advisor.contract_url || '',
      notes: advisor.notes || '',
      is_active: advisor.is_active ?? true,
    });
  };

  const closeDialog = () => {
    setIsAddOpen(false);
    setEditingAdvisor(null);
    setViewingAdvisor(null);
    setFormData(initialFormData);
  };

  const AdvisorForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">שם היועץ *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="flex items-center justify-between pt-6">
          <Label htmlFor="is_active" className="cursor-pointer">יועץ פעיל</Label>
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
        </div>
      </div>

      <div className="p-4 bg-muted/50 rounded-lg space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground">פרטי התקשרות</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">אימייל</Label>
            <Input
              id="email"
              type="email"
              dir="ltr"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">טלפון</Label>
            <Input
              id="phone"
              dir="ltr"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="p-4 bg-primary/5 rounded-lg space-y-3">
        <h4 className="font-medium text-sm text-muted-foreground">הסכם תשלום</h4>
        <div className="space-y-2">
          <Label htmlFor="payment_notes">פרטי הסכם / הערות תשלום</Label>
          <Textarea
            id="payment_notes"
            value={formData.payment_notes}
            onChange={(e) => setFormData({ ...formData, payment_notes: e.target.value })}
            placeholder="לדוגמה: 500₪ לחבילה + בונוס על קבלות"
            rows={3}
          />
        </div>
      </div>

      <div className="p-4 bg-success/5 rounded-lg space-y-3">
        <h4 className="font-medium text-sm text-muted-foreground">חוזה חתום</h4>
        {formData.contract_url ? (
          <div className="flex items-center gap-2">
            <a
              href={formData.contract_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <FileText className="h-4 w-4" />
              צפה בחוזה
            </a>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setFormData({ ...formData, contract_url: '' })}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              {uploading ? 'מעלה...' : 'העלה חוזה'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">הערות כלליות</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="הערות נוספות על היועץ..."
          rows={3}
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">
          {editingAdvisor ? 'שמור' : 'הוסף'}
        </Button>
        <Button type="button" variant="outline" onClick={closeDialog}>
          ביטול
        </Button>
      </div>
    </form>
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">יועצים</h1>
            <p className="text-muted-foreground mt-1">ניהול רשימת היועצים והסכמי תשלום</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                הוסף יועץ
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>הוסף יועץ חדש</DialogTitle>
              </DialogHeader>
              <AdvisorForm />
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">טוען...</div>
        ) : advisors.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UserCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">אין יועצים במערכת</p>
              <p className="text-sm text-muted-foreground/70">הוסף יועץ ראשון כדי להתחיל</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {advisors.map((advisor) => (
              <Card 
                key={advisor.id} 
                className={`group cursor-pointer hover:shadow-md transition-shadow ${!advisor.is_active ? 'opacity-60' : ''}`}
                onClick={() => setViewingAdvisor(advisor)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${advisor.is_active ? 'bg-primary/10' : 'bg-muted'}`}>
                        <UserCircle className={`h-6 w-6 ${advisor.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {advisor.name}
                          {!advisor.is_active && (
                            <Badge variant="secondary" className="text-xs">לא פעיל</Badge>
                          )}
                        </CardTitle>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Contact Info */}
                  {(advisor.email || advisor.phone) && (
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      {advisor.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span dir="ltr">{advisor.phone}</span>
                        </span>
                      )}
                      {advisor.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span dir="ltr">{advisor.email}</span>
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingAdvisor} onOpenChange={(open) => !open && closeDialog()}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>עריכת יועץ</DialogTitle>
            </DialogHeader>
            <AdvisorForm />
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={!!viewingAdvisor} onOpenChange={(open) => !open && setViewingAdvisor(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${viewingAdvisor?.is_active ? 'bg-primary/10' : 'bg-muted'}`}>
                  <UserCircle className={`h-6 w-6 ${viewingAdvisor?.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  {viewingAdvisor?.name}
                  {!viewingAdvisor?.is_active && (
                    <Badge variant="secondary" className="text-xs mr-2">לא פעיל</Badge>
                  )}
                </div>
              </DialogTitle>
            </DialogHeader>
            
            {viewingAdvisor && (
              <div className="space-y-4 mt-4">
                {/* Contact Info */}
                {(viewingAdvisor.email || viewingAdvisor.phone) && (
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">פרטי התקשרות</h4>
                    {viewingAdvisor.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span dir="ltr">{viewingAdvisor.phone}</span>
                      </div>
                    )}
                    {viewingAdvisor.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span dir="ltr">{viewingAdvisor.email}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Payment Notes */}
                {viewingAdvisor.payment_notes && (
                  <div className="p-4 bg-primary/5 rounded-lg">
                    <h4 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-2">
                      <Banknote className="h-4 w-4" />
                      הסכם תשלום
                    </h4>
                    <p className="text-sm">{viewingAdvisor.payment_notes}</p>
                  </div>
                )}

                {/* Contract */}
                {viewingAdvisor.contract_url && (
                  <a
                    href={viewingAdvisor.contract_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline p-4 border rounded-lg"
                  >
                    <FileText className="h-4 w-4" />
                    צפה בחוזה החתום
                  </a>
                )}

                {/* Notes */}
                {viewingAdvisor.notes && (
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">הערות</h4>
                    <p className="text-sm">{viewingAdvisor.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    className="flex-1 gap-2" 
                    onClick={() => {
                      openEdit(viewingAdvisor);
                      setViewingAdvisor(null);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    ערוך
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="gap-2"
                    onClick={() => {
                      deleteMutation.mutate(viewingAdvisor.id);
                      setViewingAdvisor(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    מחק
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
