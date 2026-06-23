import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { GlobalSearchInput } from '@/components/search/GlobalSearchInput';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, UserX, Undo2, Phone, Mail, GraduationCap, Calendar, MapPin, Briefcase, Share2, DollarSign, User, FileText, Building, CheckCircle, XCircle, ArrowUpDown, Pencil, ArrowRightLeft } from 'lucide-react';
import { InlineReasonEditor } from '@/components/InlineReasonEditor';
import { supabase } from '@/integrations/supabase/client';
import { resolveCurrentAdvisor } from '@/lib/resolveCurrentAdvisor';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EditLeadDialog } from '@/components/leads/EditLeadDialog';
import { EditStudentDialog } from '@/components/students/EditStudentDialog';
import { Lead, Student } from '@/types/crm';

interface FullLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string | null;
  status: string;
  degree_type: string;
  interested_field: string | null;
  interested_country: string | null;
  meeting_summary: string | null;
  created_at: string;
  last_contact_at: string;
  advisor_name: string | null;
  package_notes: string | null;
  leads_year: string | null;
  discontinue_reason: string | null;
}

interface FullStudent {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string | null;
  status: string;
  degree_type: string;
  interested_field: string | null;
  interested_country: string | null;
  meeting_summary: string | null;
  created_at: string;
  package_cost: number | null;
  payment_notes: string | null;
  payment_type: string | null;
  package_notes: string | null;
  amount_paid: number | null;
  advisor_name: string | null;
  is_paid: boolean | null;
  signed_agreement: boolean | null;
  target_country: string | null;
  target_university: string | null;
  program: string | null;
  graduation_year: string | null;
  discontinue_reason: string | null;
  accepted_universities: { id?: string; name: string; country?: string | null; acceptance_letter_url: string | null }[];
}

const degreeTypeLabels: Record<string, string> = {
  bachelor: 'Bachelor',
  master: 'Master',
  phd: 'PhD',
  doctorate: 'PhD',
};

export default function DidNotContinue() {
  const { year } = useParams<{ year: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [selectedLead, setSelectedLead] = useState<FullLead | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<FullStudent | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Helper to check if a date falls within the year filter
  const isInYearRange = (dateString: string) => {
    const date = new Date(dateString);
    const itemYear = date.getFullYear();
    
    if (year === '2025-and-below') {
      return itemYear <= 2025;
    }
    return itemYear === parseInt(year || '2026');
  };

  // Get display label for the year
  const yearDisplayLabel = year === '2025-and-below' ? '2025 and below' : year;

  // Fetch leads that did not continue (full data)
  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ['did-not-continue-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('did_not_continue', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as FullLead[];
    }
  });

  // Fetch students that did not continue (full data)
  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['did-not-continue-students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          accepted_universities (name, acceptance_letter_url)
        `)
        .eq('did_not_continue', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as FullStudent[];
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
      toast.success('Inquiry restored to the list');
      setSelectedLead(null);
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
      toast.success('Student restored to the list');
      setSelectedStudent(null);
    }
  });

  // Save discontinue reason for lead
  const saveLeadReasonMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase
        .from('leads')
        .update({ discontinue_reason: reason || null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['did-not-continue-leads'] });
      toast.success('Reason updated');
    }
  });

  // Save discontinue reason for student
  const saveStudentReasonMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase
        .from('students')
        .update({ discontinue_reason: reason || null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['did-not-continue-students'] });
      toast.success('Reason updated');
    }
  });

  // Move lead to students did-not-continue
  const moveLeadToStudentsMutation = useMutation({
    mutationFn: async (lead: FullLead) => {
      // Carry over the lead's advisor_id when available; fall back to current
      // advisor so RLS lets the insert through. Admins (no advisor row) keep
      // advisor_id NULL — IEC inbox.
      const current = await resolveCurrentAdvisor();
      const advisorId = (lead as any).advisor_id ?? current.id;
      const advisorName = lead.advisor_name ?? current.name ?? null;

      const { error: insertError } = await supabase
        .from('students')
        .insert({
          name: lead.name,
          email: lead.email || '',
          phone: lead.phone,
          degree_type: lead.degree_type,
          interested_country: lead.interested_country,
          interested_field: lead.interested_field,
          source: lead.source,
          meeting_summary: lead.meeting_summary,
          advisor_id: advisorId,
          advisor_name: advisorName,
          package_notes: lead.package_notes,
          did_not_continue: true,
          discontinue_reason: lead.discontinue_reason,
          created_at: lead.created_at,
        } as any);
      if (insertError) throw insertError;
      const { error: deleteError } = await supabase.from('leads').delete().eq('id', lead.id);
      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['did-not-continue-leads'] });
      queryClient.invalidateQueries({ queryKey: ['did-not-continue-students'] });
      toast.success('Moved to students successfully');
      setSelectedLead(null);
    },
    onError: () => toast.error('Error moving'),
  });

  // Move student to leads did-not-continue
  const moveStudentToLeadsMutation = useMutation({
    mutationFn: async (student: FullStudent) => {
      // Same pattern as the lead → student direction: keep the row's advisor
      // attribution so RLS lets the insert pass.
      const current = await resolveCurrentAdvisor();
      const advisorId = (student as any).advisor_id ?? current.id;
      const advisorName = student.advisor_name ?? current.name ?? null;

      const { error: insertError } = await supabase
        .from('leads')
        .insert({
          name: student.name,
          email: student.email || '',
          phone: student.phone,
          degree_type: student.degree_type,
          interested_country: student.interested_country,
          interested_field: student.interested_field,
          source: student.source,
          meeting_summary: student.meeting_summary,
          advisor_id: advisorId,
          advisor_name: advisorName,
          package_notes: student.package_notes,
          did_not_continue: true,
          discontinue_reason: student.discontinue_reason,
          created_at: student.created_at,
        } as any);
      if (insertError) throw insertError;
      const { error: deleteError } = await supabase.from('students').delete().eq('id', student.id);
      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['did-not-continue-leads'] });
      queryClient.invalidateQueries({ queryKey: ['did-not-continue-students'] });
      toast.success('Moved to inquiries successfully');
      setSelectedStudent(null);
    },
    onError: () => toast.error('Error moving'),
  });


  const convertToLeadType = (lead: FullLead): Lead => ({
    id: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    source: lead.source || '',
    status: lead.status as any,
    degreeType: (lead.degree_type === 'doctorate' ? 'phd' : lead.degree_type) as any,
    interestedCountry: lead.interested_country || '',
    interestedField: lead.interested_field || '',
    meetingSummary: lead.meeting_summary || '',
    packageNotes: lead.package_notes || '',
    leadsYear: lead.leads_year || '',
    advisorName: lead.advisor_name || '',
    createdAt: new Date(lead.created_at),
    lastContactAt: new Date(lead.last_contact_at),
  });

  // Convert FullStudent to Student type for EditStudentDialog
  const convertToStudentType = (student: FullStudent): Student => ({
    id: student.id,
    name: student.name,
    email: student.email || '',
    phone: student.phone,
    source: student.source || '',
    status: student.status as any,
    degreeType: (student.degree_type === 'doctorate' ? 'phd' : student.degree_type) as any,
    interestedCountry: student.interested_country || '',
    interestedField: student.interested_field || '',
    meetingSummary: student.meeting_summary || '',
    createdAt: new Date(student.created_at),
    advisorName: student.advisor_name || '',
    paymentType: (student.payment_type as any) || 'package',
    packageCost: Number(student.package_cost) || 0,
    amountPaid: Number(student.amount_paid) || 0,
    paymentNotes: student.payment_notes || '',
    packageNotes: student.package_notes || '',
    isPaid: student.is_paid || false,
    signedAgreement: student.signed_agreement || false,
    targetCountry: student.target_country || '',
    targetUniversity: student.target_university || '',
    program: student.program || '',
    graduationYear: student.graduation_year || '',
    notes: [],
    acceptedUniversities: (student.accepted_universities || []).map((uni: any) => ({
      id: uni.id,
      name: uni.name,
      country: uni.country || '',
      acceptanceLetterUrl: uni.acceptance_letter_url,
    })),
  });

  const handleEditLead = async (updatedLead: Lead) => {
    const { error } = await supabase
      .from('leads')
      .update({
        name: updatedLead.name,
        email: updatedLead.email,
        phone: updatedLead.phone,
        degree_type: updatedLead.degreeType,
        interested_country: updatedLead.interestedCountry,
        interested_field: updatedLead.interestedField,
        source: updatedLead.source,
        meeting_summary: updatedLead.meetingSummary,
        status: updatedLead.status,
        package_notes: updatedLead.packageNotes,
        leads_year: updatedLead.leadsYear,
        advisor_name: updatedLead.advisorName,
      })
      .eq('id', updatedLead.id);

    if (error) {
      toast.error('Error updating the inquiry');
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['did-not-continue-leads'] });
    toast.success('Inquiry updated successfully');
  };

  const handleEditStudent = async (updatedStudent: Student) => {
    const { error } = await supabase
      .from('students')
      .update({
        name: updatedStudent.name,
        email: updatedStudent.email,
        phone: updatedStudent.phone,
        degree_type: updatedStudent.degreeType === 'phd' ? 'doctorate' : updatedStudent.degreeType,
        interested_country: updatedStudent.interestedCountry,
        interested_field: updatedStudent.interestedField,
        source: updatedStudent.source,
        meeting_summary: updatedStudent.meetingSummary,
        status: updatedStudent.status,
        advisor_name: updatedStudent.advisorName,
        package_cost: updatedStudent.packageCost,
        amount_paid: updatedStudent.amountPaid ?? 0,
        payment_notes: updatedStudent.paymentNotes,
        payment_type: updatedStudent.paymentType || 'package',
        is_paid: updatedStudent.isPaid,
        signed_agreement: updatedStudent.signedAgreement,
        target_country: updatedStudent.targetCountry,
        target_university: updatedStudent.targetUniversity,
        program: updatedStudent.program,
      })
      .eq('id', updatedStudent.id);

    if (error) {
      toast.error('Error updating the student');
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['did-not-continue-students'] });
    toast.success('Student updated successfully');
  };

  useEffect(() => {
    const itemId = searchParams.get('highlight');
    if (itemId) {
      setHighlightedId(itemId);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('highlight');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Scroll to highlighted item when data loads
  useEffect(() => {
    if (highlightedId && !leadsLoading && !studentsLoading) {
      const element = itemRefs.current[highlightedId];
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        setTimeout(() => {
          setHighlightedId(null);
        }, 3000);
      }
    }
  }, [highlightedId, leadsLoading, studentsLoading, leads, students]);

  const filteredLeads = useMemo(() => {
    const filtered = leads.filter(lead =>
      isInYearRange(lead.created_at) &&
      (lead.name.includes(searchTerm) ||
      (lead.email || '').includes(searchTerm) ||
      (lead.phone || '').includes(searchTerm))
    );
    return filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [leads, searchTerm, sortOrder, year]);

  const filteredStudents = useMemo(() => {
    const filtered = students.filter(student =>
      isInYearRange(student.created_at) &&
      (student.name.includes(searchTerm) ||
      student.email.includes(searchTerm) ||
      student.phone.includes(searchTerm))
    );
    return filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [students, searchTerm, sortOrder, year]);

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
        {/* Sticky Header and Search - Only search is sticky */}
        <div className="sticky top-0 z-10 bg-background pb-4 -mx-4 px-4 lg:-mx-8 lg:px-8 pt-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <UserX className="h-8 w-8 text-muted-foreground" />
                Closed / Lost - {yearDisplayLabel}
              </h1>
              <p className="text-muted-foreground mt-1">
                Inquiries and students who did not continue ({filteredLeads.length + filteredStudents.length} total)
              </p>
            </div>
          </div>

          {/* Search - Only this stays sticky */}
          <GlobalSearchInput
            placeholder="Search by name, email, or phone..."
            localSearchTerm={searchTerm}
            onLocalSearchChange={setSearchTerm}
            currentPage="did-not-continue"
            className="flex-1"
          />
        </div>

        {/* Sort - Not sticky, will scroll with content */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'newest' | 'oldest')}>
            <SelectTrigger className="w-full sm:w-48">
              <ArrowUpDown className="h-4 w-4 ml-2" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="leads" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="leads">Inquiries ({filteredLeads.length})</TabsTrigger>
            <TabsTrigger value="students">Students ({filteredStudents.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="leads">
            <div className="space-y-4">
              {filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <div
                    key={lead.id}
                    ref={(el) => { itemRefs.current[lead.id] = el; }}
                    className={`rounded-xl bg-card p-5 border border-border/50 hover:shadow-md scroll-mt-40 transition-all duration-500 cursor-pointer ${highlightedId === lead.id ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                    onClick={() => setSelectedLead(lead)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-card-foreground hover:text-primary transition-colors">
                          {lead.name}
                        </h3>
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
                            <span>{format(new Date(lead.created_at), 'dd/MM/yyyy')}</span>
                          </div>
                        </div>
                        <InlineReasonEditor
                          reason={lead.discontinue_reason}
                          onSave={(reason) => saveLeadReasonMutation.mutate({ id: lead.id, reason })}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingLead(convertToLeadType(lead));
                          }}
                          className="gap-1"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveLeadToStudentsMutation.mutate(lead);
                          }}
                          className="gap-1"
                        >
                          <ArrowRightLeft className="h-4 w-4" />
                          Move to Students
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            restoreLeadMutation.mutate(lead.id);
                          }}
                          className="gap-1"
                        >
                          <Undo2 className="h-4 w-4" />
                          Restore
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-card rounded-xl border border-border/50">
                  <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No inquiries that did not continue</p>
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
                    ref={(el) => { itemRefs.current[student.id] = el; }}
                    className={`rounded-xl bg-card p-5 border border-border/50 hover:shadow-md scroll-mt-40 transition-all duration-500 cursor-pointer ${highlightedId === student.id ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                    onClick={() => setSelectedStudent(student)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-card-foreground hover:text-primary transition-colors">
                          {student.name}
                        </h3>
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
                            <span>{format(new Date(student.created_at), 'dd/MM/yyyy')}</span>
                          </div>
                        </div>
                        <InlineReasonEditor
                          reason={student.discontinue_reason}
                          onSave={(reason) => saveStudentReasonMutation.mutate({ id: student.id, reason })}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingStudent(convertToStudentType(student));
                          }}
                          className="gap-1"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveStudentToLeadsMutation.mutate(student);
                          }}
                          className="gap-1"
                        >
                          <ArrowRightLeft className="h-4 w-4" />
                          Move to Inquiries
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            restoreStudentMutation.mutate(student.id);
                          }}
                          className="gap-1"
                        >
                          <Undo2 className="h-4 w-4" />
                          Restore
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-card rounded-xl border border-border/50">
                  <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No students that did not continue</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Lead Details Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {selectedLead?.name.charAt(0)}
              </div>
              {selectedLead?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedLead && (
            <div className="space-y-6 pt-4">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>{selectedLead.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span dir="ltr">{selectedLead.phone}</span>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Degree Type:</strong> {degreeTypeLabels[selectedLead.degree_type] || selectedLead.degree_type}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Country:</strong> {selectedLead.interested_country || 'Not specified'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Field:</strong> {selectedLead.interested_field || 'Not specified'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Source:</strong> {selectedLead.source || 'Not specified'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Created:</strong> {format(new Date(selectedLead.created_at), 'dd/MM/yyyy')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Last Contact:</strong> {format(new Date(selectedLead.last_contact_at), 'dd/MM/yyyy')}
                  </span>
                </div>
              </div>

              {/* Discontinue Reason */}
              {selectedLead.discontinue_reason && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-destructive">Reason for not continuing:</h4>
                  <div className="bg-destructive/10 rounded-lg p-4 text-sm">
                    {selectedLead.discontinue_reason}
                  </div>
                </div>
              )}

              {/* Package Notes */}
              {selectedLead.package_notes && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Package Notes:</h4>
                  <div className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-wrap">
                    {selectedLead.package_notes}
                  </div>
                </div>
              )}

              {/* Meeting Summary */}
              {selectedLead.meeting_summary && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Meeting Summary:</h4>
                  <div className="bg-muted/50 rounded-lg p-4 text-sm">
                    {selectedLead.meeting_summary}
                  </div>
                </div>
              )}

              {/* Action */}
              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={() => restoreLeadMutation.mutate(selectedLead.id)}
                  className="gap-2"
                >
                  <Undo2 className="h-4 w-4" />
                  Restore to inquiries list
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Student Details Dialog */}
      <Dialog open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {selectedStudent?.name.charAt(0)}
              </div>
              {selectedStudent?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedStudent && (
            <div className="space-y-6 pt-4">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>{selectedStudent.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span dir="ltr">{selectedStudent.phone}</span>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2">
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${selectedStudent.signed_agreement ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning-foreground'}`}>
                  {selectedStudent.signed_agreement ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  <span>{selectedStudent.signed_agreement ? 'Agreement signed' : 'Agreement not signed'}</span>
                </div>
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${selectedStudent.is_paid ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                  {selectedStudent.is_paid ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  <span>{selectedStudent.is_paid ? 'Paid' : 'Not paid'}</span>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Degree Type:</strong> {degreeTypeLabels[selectedStudent.degree_type] || selectedStudent.degree_type}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Requested Country:</strong> {selectedStudent.interested_country || 'Not specified'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Field:</strong> {selectedStudent.interested_field || 'Not specified'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Source:</strong> {selectedStudent.source || 'Not specified'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Package Cost:</strong> ${(selectedStudent.package_cost || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Consultant:</strong> {selectedStudent.advisor_name || 'Not specified'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Created:</strong> {format(new Date(selectedStudent.created_at), 'dd/MM/yyyy')}
                  </span>
                </div>
                {selectedStudent.target_country && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="text-sm">
                      <strong>Selected Country:</strong> {selectedStudent.target_country}
                    </span>
                  </div>
                )}
                {selectedStudent.target_university && (
                  <div className="flex items-center gap-2 col-span-2">
                    <Building className="h-4 w-4 text-primary" />
                    <span className="text-sm">
                      <strong>Selected University:</strong> {selectedStudent.target_university}
                    </span>
                  </div>
                )}
                {selectedStudent.program && (
                  <div className="flex items-center gap-2 col-span-2">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    <span className="text-sm">
                      <strong>Program:</strong> {selectedStudent.program}
                    </span>
                  </div>
                )}
              </div>

              {/* Payment Notes */}
              {selectedStudent.payment_notes && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Payment Notes:</h4>
                  <div className="bg-muted/50 rounded-lg p-4 text-sm">
                    {selectedStudent.payment_notes}
                  </div>
                </div>
              )}

              {/* Accepted Universities */}
              {selectedStudent.accepted_universities && selectedStudent.accepted_universities.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Universities accepted to:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedStudent.accepted_universities.map((uni, index) => (
                      <div key={index} className="flex items-center gap-1 bg-success/10 text-success px-3 py-1 rounded-full text-sm">
                        <CheckCircle className="h-3 w-3" />
                        <span>{uni.name}</span>
                        {uni.acceptance_letter_url && (
                          <a 
                            href={uni.acceptance_letter_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="mr-1 hover:text-success/80"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FileText className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Discontinue Reason */}
              {selectedStudent.discontinue_reason && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-destructive">Reason for not continuing:</h4>
                  <div className="bg-destructive/10 rounded-lg p-4 text-sm">
                    {selectedStudent.discontinue_reason}
                  </div>
                </div>
              )}

              {/* Package Notes */}
              {selectedStudent.package_notes && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Package Notes:</h4>
                  <div className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-wrap">
                    {selectedStudent.package_notes}
                  </div>
                </div>
              )}

              {selectedStudent.meeting_summary && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Meeting Summary:</h4>
                  <div className="bg-muted/50 rounded-lg p-4 text-sm">
                    {selectedStudent.meeting_summary}
                  </div>
                </div>
              )}

              {/* Action */}
              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={() => restoreStudentMutation.mutate(selectedStudent.id)}
                  className="gap-2"
                >
                  <Undo2 className="h-4 w-4" />
                  Restore to students list
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <EditLeadDialog
        lead={editingLead}
        open={!!editingLead}
        onOpenChange={(open) => !open && setEditingLead(null)}
        onSave={handleEditLead}
        includeInactiveAdvisors={true}
      />

      <EditStudentDialog
        student={editingStudent}
        open={!!editingStudent}
        onOpenChange={(open) => !open && setEditingStudent(null)}
        onSave={handleEditStudent}
      />
    </MainLayout>
  );
}
