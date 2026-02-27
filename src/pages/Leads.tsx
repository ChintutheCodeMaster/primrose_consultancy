import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { LeadRow } from '@/components/leads/LeadRow';
import { AddLeadDialog } from '@/components/leads/AddLeadDialog';
import { EditLeadDialog } from '@/components/leads/EditLeadDialog';
import { ConvertToStudentDialog } from '@/components/leads/ConvertToStudentDialog';
import { ImportLeadsExcelDialog } from '@/components/leads/ImportLeadsExcelDialog';
import { GlobalSearchInput } from '@/components/search/GlobalSearchInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowUpDown, Upload } from 'lucide-react';
import { Lead, LeadStatus, leadStatusLabels, Student, DegreeType } from '@/types/crm';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { DiscontinueReasonDialog } from '@/components/DiscontinueReasonDialog';

export default function Leads() {
  const navigate = useNavigate();
  const { year } = useParams<{ year: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [highlightedLeadId, setHighlightedLeadId] = useState<string | null>(null);
  const leadRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  // Edit dialog state
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  // Convert dialog state
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  
  // Import dialog state
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Discontinue dialog state
  const [discontinuingLead, setDiscontinuingLead] = useState<Lead | null>(null);

  // Fetch leads from Supabase filtered by year
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads', year],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select('*')
        .eq('did_not_continue', false)
        .order('created_at', { ascending: false });
      
      // Filter by leads_year field
      if (year) {
        query = query.eq('leads_year', year);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return (data || []).map((lead): Lead => ({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        source: lead.source || '',
        status: lead.status as LeadStatus,
        degreeType: lead.degree_type as DegreeType,
        interestedCountry: lead.interested_country || '',
        interestedField: lead.interested_field || '',
        meetingSummary: lead.meeting_summary || '',
        packageNotes: lead.package_notes || '',
        createdAt: new Date(lead.created_at),
        lastContactAt: new Date(lead.last_contact_at),
        leadsYear: lead.leads_year || '',
        advisorName: lead.advisor_name || '',
      }));
    }
  });

  // Handle highlight parameter for scrolling to specific lead
  useEffect(() => {
    const leadId = searchParams.get('highlight');
    if (leadId) {
      setHighlightedLeadId(leadId);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('highlight');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Scroll to highlighted lead when data loads
  useEffect(() => {
    if (highlightedLeadId && !isLoading && leads.length > 0) {
      const element = leadRefs.current[highlightedLeadId];
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        setTimeout(() => {
          setHighlightedLeadId(null);
        }, 3000);
      }
    }
  }, [highlightedLeadId, isLoading, leads]);

  const filteredLeads = useMemo(() => {
    const filtered = leads.filter(lead => {
      const matchesSearch = lead.name.includes(searchTerm) || 
                           lead.email.includes(searchTerm) || 
                           lead.phone.includes(searchTerm) ||
                           lead.interestedField.includes(searchTerm);
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
    
    return filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [leads, searchTerm, statusFilter, sortOrder]);

  const handleAddLead = async (newLead: Omit<Lead, 'id' | 'createdAt' | 'lastContactAt'> & { leadsYear: string }) => {
    const { error } = await supabase.from('leads').insert({
      name: newLead.name,
      email: newLead.email,
      phone: newLead.phone,
      source: newLead.source,
      status: newLead.status,
      degree_type: newLead.degreeType,
      interested_country: newLead.interestedCountry,
      interested_field: newLead.interestedField,
      meeting_summary: newLead.meetingSummary,
      package_notes: newLead.packageNotes,
      leads_year: newLead.leadsYear,
    });
    
    if (error) {
      toast.error('שגיאה בהוספת הליד');
      return;
    }
    
    queryClient.invalidateQueries({ queryKey: ['leads'] });
    toast.success('הליד נוסף בהצלחה!');
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setIsEditOpen(true);
  };

  const handleSaveLead = async (updatedLead: Lead) => {
    const { error } = await supabase
      .from('leads')
      .update({
        name: updatedLead.name,
        email: updatedLead.email,
        phone: updatedLead.phone,
        source: updatedLead.source,
        status: updatedLead.status,
        degree_type: updatedLead.degreeType,
        interested_country: updatedLead.interestedCountry,
        interested_field: updatedLead.interestedField,
        meeting_summary: updatedLead.meetingSummary,
        package_notes: updatedLead.packageNotes,
        leads_year: updatedLead.leadsYear,
        advisor_name: updatedLead.advisorName,
      })
      .eq('id', updatedLead.id);
    
    if (error) {
      toast.error('שגיאה בעדכון הליד');
      return;
    }
    
    queryClient.invalidateQueries({ queryKey: ['leads'] });
    toast.success('הליד עודכן בהצלחה!');
  };

  const handleConvertClick = (lead: Lead) => {
    setConvertingLead(lead);
    setIsConvertOpen(true);
  };

  const handleDidNotContinue = async (leadId: string, reason: string) => {
    const { error } = await supabase
      .from('leads')
      .update({ did_not_continue: true, discontinue_reason: reason || null })
      .eq('id', leadId);
    
    if (error) {
      toast.error('שגיאה בעדכון');
      return;
    }
    
    queryClient.invalidateQueries({ queryKey: ['leads'] });
    queryClient.invalidateQueries({ queryKey: ['did-not-continue-leads'] });
    toast.success('המתעניין הועבר לרשימת "לא המשיכו"');
  };

  const handleDeleteLead = async (leadId: string) => {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId);
    
    if (error) {
      toast.error('שגיאה במחיקת המתעניין');
      return;
    }
    
    queryClient.invalidateQueries({ queryKey: ['leads'] });
    toast.success('המתעניין נמחק בהצלחה');
  };

  const handleConvertToStudent = async (newStudent: Omit<Student, 'id' | 'createdAt' | 'notes' | 'documents'>) => {
    // Insert new student
    const { error: studentError } = await supabase.from('students').insert({
      name: newStudent.name,
      email: newStudent.email,
      phone: newStudent.phone,
      status: newStudent.status,
      degree_type: newStudent.degreeType,
      interested_country: newStudent.interestedCountry,
      interested_field: newStudent.interestedField,
      source: newStudent.source,
      meeting_summary: newStudent.meetingSummary,
      package_notes: newStudent.packageNotes,
      package_cost: newStudent.packageCost,
      payment_notes: newStudent.paymentNotes,
      advisor_name: newStudent.advisorName,
      is_paid: newStudent.isPaid,
      signed_agreement: newStudent.signedAgreement,
      target_country: newStudent.targetCountry,
      target_university: newStudent.targetUniversity,
      program: newStudent.program,
    });
    
    if (studentError) {
      toast.error('שגיאה בהמרה לסטודנט');
      return;
    }
    
    // Delete the lead after successful conversion
    if (convertingLead) {
      await supabase
        .from('leads')
        .delete()
        .eq('id', convertingLead.id);
    }
    
    queryClient.invalidateQueries({ queryKey: ['leads'] });
    queryClient.invalidateQueries({ queryKey: ['students'] });
    toast.success('הליד הומר לסטודנט בהצלחה!');
    
    // Navigate to students page
    navigate('/students');
  };

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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                מתעניינים {year ? `'${year}` : ''}
              </h1>
              <p className="text-muted-foreground mt-1">ניהול פניות התעניינות ({filteredLeads.length} מתעניינים)</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                <Upload className="h-4 w-4 ml-2" />
                ייבוא מאקסל
              </Button>
              <AddLeadDialog onAdd={handleAddLead} defaultYear={year} />
            </div>
          </div>

          {/* Search - Only this stays sticky */}
          <GlobalSearchInput
            placeholder="חיפוש לפי שם, אימייל, טלפון או תחום..."
            localSearchTerm={searchTerm}
            onLocalSearchChange={setSearchTerm}
            currentPage="leads"
            className="flex-1"
          />
        </div>

        {/* Filters - Not sticky, will scroll with content */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as LeadStatus | 'all')}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="סטטוס" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הסטטוסים</SelectItem>
              {Object.entries(leadStatusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'newest' | 'oldest')}>
            <SelectTrigger className="w-full sm:w-48">
              <ArrowUpDown className="h-4 w-4 ml-2" />
              <SelectValue placeholder="מיון" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">מהחדש לישן</SelectItem>
              <SelectItem value="oldest">מהישן לחדש</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Leads List */}
        <div className="space-y-4">
          {filteredLeads.map((lead, index) => (
            <div 
              key={lead.id} 
              ref={(el) => { leadRefs.current[lead.id] = el; }}
              className={`animate-slide-up scroll-mt-40 transition-all duration-500 ${highlightedLeadId === lead.id ? 'ring-2 ring-primary ring-offset-2 rounded-2xl' : ''}`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <LeadRow 
                lead={lead} 
                onEdit={() => handleEditLead(lead)}
                onConvert={() => handleConvertClick(lead)}
                onDidNotContinue={() => handleDidNotContinue(lead.id)}
                onDelete={() => handleDeleteLead(lead.id)}
              />
            </div>
          ))}
        </div>

        {filteredLeads.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">לא נמצאו מתעניינים</p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <EditLeadDialog
        lead={editingLead}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSave={handleSaveLead}
      />

      {/* Convert Dialog */}
      <ConvertToStudentDialog
        lead={convertingLead}
        open={isConvertOpen}
        onOpenChange={setIsConvertOpen}
        onConvert={handleConvertToStudent}
      />

      {/* Import Dialog */}
      <ImportLeadsExcelDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImportComplete={() => queryClient.invalidateQueries({ queryKey: ['leads'] })}
        year={year || '26'}
      />
    </MainLayout>
  );
}
