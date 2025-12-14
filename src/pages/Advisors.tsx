import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, UserCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Advisor {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
}

export default function Advisors() {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAdvisor, setEditingAdvisor] = useState<Advisor | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });

  const { data: advisors = [], isLoading } = useQuery({
    queryKey: ['advisors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advisors')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Advisor[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; phone: string }) => {
      const { error } = await supabase.from('advisors').insert({
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advisors'] });
      toast.success('יועץ נוסף בהצלחה');
      setIsAddOpen(false);
      setFormData({ name: '', email: '', phone: '' });
    },
    onError: () => toast.error('שגיאה בהוספת יועץ'),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; email: string; phone: string }) => {
      const { error } = await supabase
        .from('advisors')
        .update({
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
        })
        .eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advisors'] });
      toast.success('יועץ עודכן בהצלחה');
      setEditingAdvisor(null);
      setFormData({ name: '', email: '', phone: '' });
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
    });
  };

  const closeDialog = () => {
    setIsAddOpen(false);
    setEditingAdvisor(null);
    setFormData({ name: '', email: '', phone: '' });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">יועצים</h1>
            <p className="text-muted-foreground mt-1">ניהול רשימת היועצים</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                הוסף יועץ
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>הוסף יועץ חדש</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">שם היועץ *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
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
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    הוסף
                  </Button>
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    ביטול
                  </Button>
                </div>
              </form>
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {advisors.map((advisor) => (
              <Card key={advisor.id} className="group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <UserCircle className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{advisor.name}</CardTitle>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(advisor)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate(advisor.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-1">
                  {advisor.email && <p dir="ltr" className="text-right">{advisor.email}</p>}
                  {advisor.phone && <p dir="ltr" className="text-right">{advisor.phone}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingAdvisor} onOpenChange={(open) => !open && closeDialog()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>עריכת יועץ</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">שם היועץ *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">אימייל</Label>
                <Input
                  id="edit-email"
                  type="email"
                  dir="ltr"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">טלפון</Label>
                <Input
                  id="edit-phone"
                  dir="ltr"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  שמור
                </Button>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  ביטול
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
