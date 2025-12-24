import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { LeadRow } from '@/components/leads/LeadRow';
import { AddLeadDialog } from '@/components/leads/AddLeadDialog';
import { EditLeadDialog } from '@/components/leads/EditLeadDialog';
import { ConvertToStudentDialog } from '@/components/leads/ConvertToStudentDialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Loader2 } from 'lucide-react';
import { Lead, LeadStatus, leadStatusLabels, Student, DegreeType } from '@/types/crm';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function Leads() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  
  // Edit dialog state
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  // Convert dialog state
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);
  const [isConvertOpen, setIsConvertOpen] = useState(false);

  // Fetch leads from Supabase
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      
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
        createdAt: new Date(lead.created_at),
        lastContactAt: new Date(lead.last_contact_at),
      }));
    }
  });

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.includes(searchTerm) || 
                         lead.email.includes(searchTerm) || 
                         lead.phone.includes(searchTerm) ||
                         lead.interestedField.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddLead = async (newLead: Omit<Lead, 'id' | 'createdAt' | 'lastContactAt'>) => {
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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">לידים</h1>
            <p className="text-muted-foreground mt-1">ניהול פניות התעניינות ({filteredLeads.length} לידים)</p>
          </div>
          <AddLeadDialog onAdd={handleAddLead} />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש לפי שם, אימייל, טלפון או תחום..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
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
        </div>

        {/* Leads List */}
        <div className="space-y-4">
          {filteredLeads.map((lead, index) => (
            <div key={lead.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
              <LeadRow 
                lead={lead} 
                onEdit={() => handleEditLead(lead)}
                onConvert={() => handleConvertClick(lead)}
              />
            </div>
          ))}
        </div>

        {filteredLeads.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">לא נמצאו לידים</p>
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
    </MainLayout>
  );
}
