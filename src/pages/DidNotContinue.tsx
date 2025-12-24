import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, UserX, Undo2, Phone, Mail, GraduationCap, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DidNotContinueLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  interested_field: string | null;
  interested_country: string | null;
  created_at: string;
}

interface DidNotContinueStudent {
  id: string;
  name: string;
  email: string;
  phone: string;
  interested_field: string | null;
  interested_country: string | null;
  created_at: string;
  package_cost: number | null;
}

export default function DidNotContinue() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch leads that did not continue
  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ['did-not-continue-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('id, name, email, phone, interested_field, interested_country, created_at')
        .eq('did_not_continue', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as DidNotContinueLead[];
    }
  });

  // Fetch students that did not continue
  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['did-not-continue-students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, name, email, phone, interested_field, interested_country, created_at, package_cost')
        .eq('did_not_continue', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as DidNotContinueStudent[];
    }
  });

  // Restore lead mutation
  const restoreLeadMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const { error } = await supabase
        .from('leads')
        .update({ did_not_continue: false })
        .eq('id', leadId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['did-not-continue-leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('המתעניין הוחזר לרשימה');
    }
  });

  // Restore student mutation
  const restoreStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const { error } = await supabase
        .from('students')
        .update({ did_not_continue: false })
        .eq('id', studentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['did-not-continue-students'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('הסטודנט הוחזר לרשימה');
    }
  });

  const filteredLeads = leads.filter(lead =>
    lead.name.includes(searchTerm) ||
    lead.email.includes(searchTerm) ||
    lead.phone.includes(searchTerm)
  );

  const filteredStudents = students.filter(student =>
    student.name.includes(searchTerm) ||
    student.email.includes(searchTerm) ||
    student.phone.includes(searchTerm)
  );

  const isLoading = leadsLoading || studentsLoading;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <UserX className="h-8 w-8 text-muted-foreground" />
              לא המשיכו
            </h1>
            <p className="text-muted-foreground mt-1">
              מתעניינים וסטודנטים שלא המשיכו בתהליך ({leads.length + students.length} סה״כ)
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש לפי שם, אימייל או טלפון..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="leads" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="leads">מתעניינים ({filteredLeads.length})</TabsTrigger>
            <TabsTrigger value="students">סטודנטים ({filteredStudents.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="leads">
            <div className="space-y-4">
              {filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="rounded-xl bg-card p-5 border border-border/50 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-card-foreground">{lead.name}</h3>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            <span>{lead.email}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            <span dir="ltr">{lead.phone}</span>
                          </div>
                          {lead.interested_field && (
                            <div className="flex items-center gap-1">
                              <GraduationCap className="h-4 w-4" />
                              <span>{lead.interested_field}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(lead.created_at), 'dd/MM/yyyy', { locale: he })}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restoreLeadMutation.mutate(lead.id)}
                        className="gap-1"
                      >
                        <Undo2 className="h-4 w-4" />
                        החזר לרשימה
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-card rounded-xl border border-border/50">
                  <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">אין מתעניינים שלא המשיכו</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="students">
            <div className="space-y-4">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className="rounded-xl bg-card p-5 border border-border/50 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-card-foreground">{student.name}</h3>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            <span>{student.email}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            <span dir="ltr">{student.phone}</span>
                          </div>
                          {student.interested_field && (
                            <div className="flex items-center gap-1">
                              <GraduationCap className="h-4 w-4" />
                              <span>{student.interested_field}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(student.created_at), 'dd/MM/yyyy', { locale: he })}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restoreStudentMutation.mutate(student.id)}
                        className="gap-1"
                      >
                        <Undo2 className="h-4 w-4" />
                        החזר לרשימה
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-card rounded-xl border border-border/50">
                  <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">אין סטודנטים שלא המשיכו</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
