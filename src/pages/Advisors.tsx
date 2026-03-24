import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, UserCircle, Phone, Mail, FileText, Banknote, Link2, ExternalLink, Copy, History, Home } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { openExternalFile } from '@/lib/file-open';
import { AdvisorForm, AdvisorFormData } from '@/components/advisors/AdvisorForm';

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
  residence: string | null;
  created_at: string;
}

const initialFormData: AdvisorFormData = {
  name: '',
  email: '',
  phone: '',
  payment_notes: '',
  contract_url: '',
  notes: '',
  is_active: true,
  portal_password: '',
  residence: '',
};

export default function Advisors() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAdvisor, setEditingAdvisor] = useState<Advisor | null>(null);
  const [viewingAdvisor, setViewingAdvisor] = useState<Advisor | null>(null);
  const [formData, setFormData] = useState<AdvisorFormData>(initialFormData);

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

  // Fetch active student counts per advisor (by advisor_name field which contains comma-separated names)
  const { data: studentCounts = {} } = useQuery({
    queryKey: ['advisor-student-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('advisor_name')
        .eq('did_not_continue', false)
        .neq('status', 'graduated')
        .is('graduation_year', null); // Only count students without graduation_year (truly active)
      
      if (error) throw error;
      
      // Count students per advisor (handle comma-separated advisor names)
      const counts: Record<string, number> = {};
      data?.forEach((student) => {
        if (student.advisor_name) {
          const advisorNames = student.advisor_name.split(', ').map(n => n.trim());
          advisorNames.forEach((name) => {
            if (name) {
              counts[name] = (counts[name] || 0) + 1;
            }
          });
        }
      });
      return counts;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: AdvisorFormData) => {
      const { error } = await supabase.from('advisors').insert({
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        payment_notes: data.payment_notes || null,
        contract_url: data.contract_url || null,
        notes: data.notes || null,
        is_active: data.is_active,
        portal_password: data.portal_password || null,
        residence: data.residence || null,
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
    mutationFn: async (data: { id: string } & AdvisorFormData) => {
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
          portal_password: data.portal_password || null,
          residence: data.residence || null,
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
      portal_password: (advisor as any).portal_password || '',
    });
  };

  const closeDialog = () => {
    setIsAddOpen(false);
    setEditingAdvisor(null);
    setViewingAdvisor(null);
    setFormData(initialFormData);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              יועצים ({advisors.filter(a => a.is_active).length})
            </h1>
            <p className="text-muted-foreground mt-1">ניהול רשימת היועצים והסכמי תשלום</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => navigate('/past-advisors')}
            >
              <History className="h-4 w-4" />
              יועצי עבר
            </Button>
            <Dialog open={isAddOpen} onOpenChange={(open) => {
              setIsAddOpen(open);
              if (!open) setFormData(initialFormData);
            }}>
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
                <AdvisorForm
                  formData={formData}
                  onFormDataChange={setFormData}
                  onSubmit={handleSubmit}
                  onCancel={closeDialog}
                  isEditing={false}
                />
              </DialogContent>
            </Dialog>
          </div>
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
                onClick={() => window.open(`/advisor/${advisor.id}`, '_blank')}
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
                        {studentCounts[advisor.name] !== undefined && studentCounts[advisor.name] > 0 && (
                          <p className="text-sm text-muted-foreground">
                            {studentCounts[advisor.name]} לקוחות פעילים
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(advisor);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`/advisor/${advisor.id}`, '_blank');
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
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
            {editingAdvisor && (
              <div className="flex gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => {
                    const link = `${window.location.origin}/advisor/${editingAdvisor.id}`;
                    navigator.clipboard.writeText(link);
                    toast.success('קישור לפורטל היועץ הועתק!');
                  }}
                >
                  <Link2 className="h-4 w-4" />
                  העתק קישור לפורטל
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => window.open(`/advisor/${editingAdvisor.id}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                  פתח פורטל
                </Button>
              </div>
            )}
            <AdvisorForm
              formData={formData}
              onFormDataChange={setFormData}
              onSubmit={handleSubmit}
              onCancel={closeDialog}
              isEditing={true}
            />
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

                {viewingAdvisor.payment_notes && (
                  <div className="p-4 bg-primary/5 rounded-lg">
                    <h4 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-2">
                      <Banknote className="h-4 w-4" />
                      הסכם תשלום
                    </h4>
                    <p className="text-sm">{viewingAdvisor.payment_notes}</p>
                  </div>
                )}

                {viewingAdvisor.contract_url && (
                  <button
                    type="button"
                    className="flex items-center gap-2 text-sm text-primary hover:underline p-4 border rounded-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      openExternalFile(viewingAdvisor.contract_url, `advisor-contract-${viewingAdvisor.name}`);
                    }}
                  >
                    <FileText className="h-4 w-4" />
                    צפה בחוזה החתום
                  </button>
                )}

                {viewingAdvisor.notes && (
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">הערות</h4>
                    <p className="text-sm">{viewingAdvisor.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => {
                      const link = `${window.location.origin}/advisor/${viewingAdvisor.id}`;
                      navigator.clipboard.writeText(link);
                      toast.success('קישור לפורטל היועץ הועתק!');
                    }}
                  >
                    <Link2 className="h-4 w-4" />
                    קישור לפורטל
                  </Button>
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
