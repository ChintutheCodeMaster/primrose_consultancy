import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/ui/stat-card';
import { StudentRow } from '@/components/students/StudentRow';
import { EditStudentDialog } from '@/components/students/EditStudentDialog';
import { GraduationCap, AlertTriangle, DollarSign, UserCheck, X, Loader2, Search, ExternalLink, UserPlus, Users, History, Download, FileCheck, Check, Briefcase, Globe } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { differenceInDays, format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import type { Student, StudentStatus, DegreeType } from '@/types/crm';
import * as XLSX from 'xlsx';

interface SearchResult {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: 'leads' | 'students' | 'did-not-continue' | 'past-clients';
  locationLabel: string;
  navigateTo: string;
  year?: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showNewStudentsDialog, setShowNewStudentsDialog] = useState(false);
  const [showExportReminder, setShowExportReminder] = useState(() => {
    const lastDismissed = localStorage.getItem('export-reminder-dismissed');
    if (!lastDismissed) return true;
    const daysSince = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24);
    return daysSince >= 14;
  });

  const dismissExportReminder = () => {
    localStorage.setItem('export-reminder-dismissed', Date.now().toString());
    setShowExportReminder(false);
  };

  // Helper to format student data for Excel
  const formatStudentData = (s: any) => ({
    'Name': s.name,
    'Email': s.email || '',
    'Phone': s.phone,
    'Status': s.status,
    'Degree Type': s.degree_type,
    'Field of Interest': s.interested_field || '',
    'Preferred Country': s.interested_country || '',
    'Target Country': s.target_country || '',
    'Target University': s.target_university || '',
    'Program': s.program || '',
    'Graduation Year': s.graduation_year || '',
    'Source': s.source || '',
    'Consultant': s.advisor_name || '',
    'Package Cost': s.package_cost || 0,
    'Amount Paid': s.amount_paid || 0,
    'Paid': s.is_paid ? 'Yes' : 'No',
    'Payment Notes': s.payment_notes || '',
    'Agreement Signed': s.signed_agreement ? 'Yes' : 'No',
    'Meeting Summary': s.meeting_summary || '',
    'Accepted Universities': s.accepted_universities?.map((u: any) => u.name).join(', ') || '',
    'Creation Date': s.created_at ? format(new Date(s.created_at), 'dd/MM/yyyy') : '',
  });

  // Export all data to Excel
  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      // Fetch all leads with year info
      const { data: leads } = await supabase
        .from('leads')
        .select('*')
        .eq('did_not_continue', false)
        .order('created_at', { ascending: false });

      // Fetch leads that did not continue
      const { data: leadsDidNotContinue } = await supabase
        .from('leads')
        .select('*')
        .eq('did_not_continue', true)
        .order('created_at', { ascending: false });

      // Fetch active students (no graduation_year, not did_not_continue)
      const { data: activeStudents } = await supabase
        .from('students')
        .select('*, accepted_universities(*)')
        .is('graduation_year', null)
        .eq('did_not_continue', false)
        .order('created_at', { ascending: false });

      // Fetch past clients (has graduation_year)
      const { data: pastClients } = await supabase
        .from('students')
        .select('*, accepted_universities(*)')
        .not('graduation_year', 'is', null)
        .eq('did_not_continue', false)
        .order('graduation_year', { ascending: false });

      // Fetch students that did not continue
      const { data: studentsDidNotContinue } = await supabase
        .from('students')
        .select('*, accepted_universities(*)')
        .eq('did_not_continue', true)
        .order('created_at', { ascending: false });

      // Fetch all advisors
      const { data: advisors } = await supabase
        .from('advisors')
        .select('*')
        .order('name', { ascending: true });

      // Fetch sidebar categories to get available years
      const { data: sidebarCategories } = await supabase
        .from('sidebar_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      // Create workbook
      const wb = XLSX.utils.book_new();

      // ===== LEADS SECTION =====
      // Group leads by year
      const leadsYears = sidebarCategories?.filter(c => c.category_type === 'leads') || [];
      
      if (leadsYears.length > 0) {
        leadsYears.forEach(yearCat => {
          const yearLeads = leads?.filter(l => l.leads_year === yearCat.year_value) || [];
          if (yearLeads.length > 0) {
            const leadsData = yearLeads.map(l => ({
              'Name': l.name,
              'Email': l.email,
              'Phone': l.phone,
              'Status': l.status,
              'Degree Type': l.degree_type,
              'Field of Interest': l.interested_field || '',
              'Preferred Country': l.interested_country || '',
              'Source': l.source || '',
              'Meeting Summary': l.meeting_summary || '',
              'Creation Date': l.created_at ? format(new Date(l.created_at), 'dd/MM/yyyy') : '',
              'Last Contact': l.last_contact_at ? format(new Date(l.last_contact_at), 'dd/MM/yyyy') : '',
            }));
            const sheet = XLSX.utils.json_to_sheet(leadsData);
            XLSX.utils.book_append_sheet(wb, sheet, `Inquiries ${yearCat.display_label}`.substring(0, 31));
          }
        });
      } else if (leads && leads.length > 0) {
        // Fallback: all leads in one sheet
        const leadsData = leads.map(l => ({
          'Name': l.name,
          'Email': l.email,
          'Phone': l.phone,
          'Status': l.status,
          'Degree Type': l.degree_type,
          'Field of Interest': l.interested_field || '',
          'Preferred Country': l.interested_country || '',
          'Source': l.source || '',
          'Meeting Summary': l.meeting_summary || '',
          'Creation Date': l.created_at ? format(new Date(l.created_at), 'dd/MM/yyyy') : '',
          'Last Contact': l.last_contact_at ? format(new Date(l.last_contact_at), 'dd/MM/yyyy') : '',
        }));
        const sheet = XLSX.utils.json_to_sheet(leadsData);
        XLSX.utils.book_append_sheet(wb, sheet, 'Inquiries');
      }

      // ===== ACTIVE STUDENTS SECTION =====
      if (activeStudents && activeStudents.length > 0) {
        const studentsData = activeStudents.map(formatStudentData);
        const sheet = XLSX.utils.json_to_sheet(studentsData);
        XLSX.utils.book_append_sheet(wb, sheet, 'Active Students');
      }

      // ===== PAST CLIENTS SECTION - BY YEAR =====
      const pastClientsYears = sidebarCategories?.filter(c => c.category_type === 'past_clients') || [];
      
      if (pastClientsYears.length > 0 && pastClients && pastClients.length > 0) {
        pastClientsYears.forEach(yearCat => {
          const yearClients = pastClients.filter(s => s.graduation_year === yearCat.year_value);
          if (yearClients.length > 0) {
            const clientsData = yearClients.map(formatStudentData);
            const sheet = XLSX.utils.json_to_sheet(clientsData);
            XLSX.utils.book_append_sheet(wb, sheet, `Past Clients ${yearCat.display_label}`.substring(0, 31));
          }
        });
      } else if (pastClients && pastClients.length > 0) {
        // Fallback: Group by graduation_year
        const yearGroups = new Map<string, any[]>();
        pastClients.forEach(s => {
          const year = s.graduation_year || 'Unknown';
          if (!yearGroups.has(year)) yearGroups.set(year, []);
          yearGroups.get(year)!.push(s);
        });
        
        yearGroups.forEach((clients, year) => {
          const clientsData = clients.map(formatStudentData);
          const sheet = XLSX.utils.json_to_sheet(clientsData);
          XLSX.utils.book_append_sheet(wb, sheet, `Past Clients ${year}`.substring(0, 31));
        });
      }

      // ===== DID NOT CONTINUE SECTION =====
      const allDidNotContinue = [
        ...(leadsDidNotContinue || []).map(l => ({ ...l, type: 'lead' })),
        ...(studentsDidNotContinue || []).map(s => ({ ...s, type: 'student' }))
      ];
      
      if (allDidNotContinue.length > 0) {
        const dncData = allDidNotContinue.map(item => ({
          'Name': item.name,
          'Email': item.email || '',
          'Phone': item.phone,
          'Type': item.type === 'lead' ? 'Inquiry' : 'Student',
          'Degree Type': item.degree_type,
          'Field of Interest': item.interested_field || '',
          'Preferred Country': item.interested_country || '',
          'Source': item.source || '',
          'Meeting Summary': item.meeting_summary || '',
          'Creation Date': item.created_at ? format(new Date(item.created_at), 'dd/MM/yyyy') : '',
        }));
        const sheet = XLSX.utils.json_to_sheet(dncData);
        XLSX.utils.book_append_sheet(wb, sheet, 'Closed/Lost');
      }

      // ===== ADVISORS SECTION =====
      const activeAdvisors = advisors?.filter(a => a.is_active) || [];
      const inactiveAdvisors = advisors?.filter(a => !a.is_active) || [];

      if (activeAdvisors.length > 0) {
        const advisorsData = activeAdvisors.map(a => ({
          'Name': a.name,
          'Email': a.email || '',
          'Phone': a.phone || '',
          'Payment Type': a.payment_type || '',
          'Payment Amount': a.payment_amount || 0,
          'Payment Notes': a.payment_notes || '',
          'Notes': a.notes || '',
        }));
        const sheet = XLSX.utils.json_to_sheet(advisorsData);
        XLSX.utils.book_append_sheet(wb, sheet, 'Active Consultants');
      }

      if (inactiveAdvisors.length > 0) {
        const advisorsData = inactiveAdvisors.map(a => ({
          'Name': a.name,
          'Email': a.email || '',
          'Phone': a.phone || '',
          'Payment Type': a.payment_type || '',
          'Payment Amount': a.payment_amount || 0,
          'Payment Notes': a.payment_notes || '',
          'Notes': a.notes || '',
        }));
        const sheet = XLSX.utils.json_to_sheet(advisorsData);
        XLSX.utils.book_append_sheet(wb, sheet, 'Former Consultants');
      }

      // Download file
      const fileName = `PrimroseIEC_Data_${format(new Date(), 'dd-MM-yyyy')}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: "File downloaded successfully",
        description: `The file ${fileName} has been saved to your computer`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Error",
        description: "Could not export data",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Global search function
  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const results: SearchResult[] = [];

    try {
      // Search in leads (active)
      const { data: leads } = await supabase
        .from('leads')
        .select('id, name, email, phone, did_not_continue')
        .or(`name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`);

      if (leads) {
        leads.forEach(lead => {
          if (lead.did_not_continue) {
            results.push({
              id: lead.id,
              name: lead.name,
              email: lead.email,
              phone: lead.phone,
              location: 'did-not-continue',
              locationLabel: 'Closed/Lost (Inquiry)',
              navigateTo: `/did-not-continue?highlight=${lead.id}`
            });
          } else {
            results.push({
              id: lead.id,
              name: lead.name,
              email: lead.email,
              phone: lead.phone,
              location: 'leads',
              locationLabel: 'Inquiries',
              navigateTo: `/leads?highlight=${lead.id}`
            });
          }
        });
      }

      // Search in students
      const { data: students } = await supabase
        .from('students')
        .select('id, name, email, phone, did_not_continue, graduation_year')
        .or(`name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`);

      if (students) {
        students.forEach(student => {
          if (student.did_not_continue) {
            results.push({
              id: student.id,
              name: student.name,
              email: student.email,
              phone: student.phone,
              location: 'did-not-continue',
              locationLabel: 'Closed/Lost (Student)',
              navigateTo: `/did-not-continue?highlight=${student.id}`
            });
          } else if (student.graduation_year) {
            results.push({
              id: student.id,
              name: student.name,
              email: student.email,
              phone: student.phone,
              location: 'past-clients',
              locationLabel: `Alumni ${student.graduation_year}`,
              navigateTo: `/past-clients/${student.graduation_year}?highlight=${student.id}`,
              year: student.graduation_year
            });
          } else {
            results.push({
              id: student.id,
              name: student.name,
              email: student.email,
              phone: student.phone,
              location: 'students',
              locationLabel: 'Students',
              navigateTo: `/students?highlight=${student.id}`
            });
          }
        });
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Fetch students from Supabase
  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students-dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          accepted_universities (
            name,
            acceptance_letter_url
          )
        `)
        .is('graduation_year', null)
        .eq('did_not_continue', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        phone: s.phone,
        status: s.status as StudentStatus,
        degreeType: s.degree_type as DegreeType,
        interestedCountry: s.interested_country || '',
        interestedField: s.interested_field || '',
        source: s.source || '',
        meetingSummary: s.meeting_summary || '',
        packageCost: s.package_cost || 0,
        amountPaid: Number(s.amount_paid) || 0,
        paymentType: (s.payment_type || 'package') as 'hourly' | 'package' | 'other',
        paymentNotes: s.payment_notes || '',
        advisorName: s.advisor_name || '',
        isPaid: s.is_paid || false,
        signedAgreement: s.signed_agreement || false,
        acceptedUniversities: (s.accepted_universities || []).map((u: any) => ({
          name: u.name,
          acceptanceLetterUrl: u.acceptance_letter_url,
        })),
        targetCountry: s.target_country || '',
        targetUniversity: s.target_university || '',
        program: s.program || '',
        graduationYear: s.graduation_year || undefined,
        startDate: s.start_date ? new Date(s.start_date) : undefined,
        paymentDate: s.payment_date ? new Date(s.payment_date) : undefined,
        notes: [],
        createdAt: new Date(s.created_at),
        dismissedFromAttention: s.dismissed_from_attention || false,
      }));
    }
  });

  // Fetch recently signed agreements (not dismissed)
  const { data: recentAgreements = [] } = useQuery({
    queryKey: ['recent-agreements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_agreements')
        .select(`
          id,
          student_id,
          first_name,
          last_name,
          signed_at,
          notification_dismissed
        `)
        .eq('notification_dismissed', false)
        .order('signed_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      // Get student names for each agreement
      const studentIds = (data || []).map(a => a.student_id);
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, name')
        .in('id', studentIds);
      
      const studentMap = new Map((studentsData || []).map(s => [s.id, s.name]));
      
      return (data || []).map(a => ({
        id: a.id,
        studentId: a.student_id,
        studentName: studentMap.get(a.student_id) || `${a.first_name} ${a.last_name}`,
        signedAt: new Date(a.signed_at),
      }));
    }
  });

  // Mutation to dismiss student from attention
  const dismissMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const { error } = await supabase
        .from('students')
        .update({ dismissed_from_attention: true })
        .eq('id', studentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students-dashboard'] });
      toast({
        title: "Removed from list",
        description: "Student removed from the 'needs attention' list",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Could not remove student from the list",
        variant: "destructive",
      });
    }
  });

  // Mutation to dismiss agreement notification
  const dismissAgreementMutation = useMutation({
    mutationFn: async (agreementId: string) => {
      const { error } = await supabase
        .from('student_agreements')
        .update({ notification_dismissed: true })
        .eq('id', agreementId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recent-agreements'] });
      toast({
        title: "Notification dismissed",
        description: "The agreement signed notification has been dismissed",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Could not dismiss notification",
        variant: "destructive",
      });
    }
  });

  // Active students count - same as what's shown in Students page
  const activeStudentsCount = students.length;
  
  // Students needing attention
  // Criteria: After 4 days from creation - if not paid OR not signed agreement
  const studentsNeedingAttention = students.filter(s => {
    if (s.status === 'graduated') return false;
    if (s.dismissedFromAttention) return false;
    
    const daysSinceCreation = differenceInDays(new Date(), new Date(s.createdAt));
    
    // After 4 days: show if not signed agreement OR not paid
    if (daysSinceCreation >= 4) {
      const needsAgreementReminder = !s.signedAgreement;
      const needsPaymentReminder = !s.isPaid;
      return needsAgreementReminder || needsPaymentReminder;
    }
    
    return false;
  });
  
  // Fetch ALL students created this month (regardless of status)
  const { data: allNewStudentsThisMonth = [] } = useQuery({
    queryKey: ['all-new-students-this-month'],
    queryFn: async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      
      const { data, error } = await supabase
        .from('students')
        .select('id, name, created_at, graduation_year, did_not_continue')
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch projects with pending_payment status
  const { data: pendingPaymentProjects = [] } = useQuery({
    queryKey: ['pending-payment-projects'],
    queryFn: async () => {
      const { data: projects, error } = await supabase
        .from('projects')
        .select('id, name, amount, collaboration_id')
        .eq('status', 'pending_payment');
      
      if (error) throw error;
      
      // Get collaboration names
      const collabIds = [...new Set((projects || []).map(p => p.collaboration_id).filter(Boolean))];
      let collabMap = new Map<string, string>();
      if (collabIds.length > 0) {
        const { data: collabs } = await supabase
          .from('collaborations')
          .select('id, name')
          .in('id', collabIds);
        collabMap = new Map((collabs || []).map(c => [c.id, c.name]));
      }
      
      return (projects || []).map(p => ({
        ...p,
        collaborationName: p.collaboration_id ? collabMap.get(p.collaboration_id) || '' : '',
      }));
    }
  });

  // Fetch new website leads (is_from_website = true, created in last 7 days)
  const { data: newWebsiteLeads = [] } = useQuery({
    queryKey: ['new-website-leads'],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data, error } = await supabase
        .from('leads')
        .select('id, name, created_at, source, leads_year')
        .eq('is_from_website', true)
        .eq('did_not_continue', false)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Categorize new students this month
  const activeNewStudents = allNewStudentsThisMonth.filter(s => !s.graduation_year && !s.did_not_continue);
  const pastClientsNew = allNewStudentsThisMonth.filter(s => s.graduation_year && !s.did_not_continue);
  const didNotContinueNew = allNewStudentsThisMonth.filter(s => s.did_not_continue);
  const totalNewStudentsThisMonth = allNewStudentsThisMonth.length;

  const recentStudents = students
    .filter(s => s.status !== 'graduated')
    .slice(0, 3);

  const handleDismiss = (studentId: string) => {
    dismissMutation.mutate(studentId);
  };

  const handleEditStudent = async (updatedStudent: Student) => {
    const { error } = await supabase
      .from('students')
      .update({
        name: updatedStudent.name,
        email: updatedStudent.email,
        phone: updatedStudent.phone,
        degree_type: updatedStudent.degreeType,
        status: updatedStudent.status,
        interested_country: updatedStudent.interestedCountry,
        interested_field: updatedStudent.interestedField,
        advisor_id: updatedStudent.advisorId,
        advisor_name: updatedStudent.advisorName,
        package_cost: updatedStudent.packageCost,
        amount_paid: updatedStudent.amountPaid ?? 0,
        payment_notes: updatedStudent.paymentNotes,
        package_notes: updatedStudent.packageNotes,
        target_country: updatedStudent.targetCountry,
        target_university: updatedStudent.targetUniversity,
        program: updatedStudent.program,
        is_paid: updatedStudent.isPaid,
        signed_agreement: updatedStudent.signedAgreement,
        meeting_summary: updatedStudent.meetingSummary,
      })
      .eq('id', updatedStudent.id);

    if (error) {
      toast({
        title: "Error",
        description: "Could not update student",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Updated successfully",
        description: "Student details updated",
      });
      queryClient.invalidateQueries({ queryKey: ['students-dashboard'] });
    }
    setEditingStudent(null);
  };

  const getLocationIcon = (location: string) => {
    switch (location) {
      case 'leads': return <UserPlus className="h-4 w-4" />;
      case 'students': return <GraduationCap className="h-4 w-4" />;
      case 'did-not-continue': return <Users className="h-4 w-4" />;
      case 'past-clients': return <History className="h-4 w-4" />;
      default: return null;
    }
  };

  const getLocationColor = (location: string) => {
    switch (location) {
      case 'leads': return 'bg-primary/10 text-primary';
      case 'students': return 'bg-success/10 text-success';
      case 'did-not-continue': return 'bg-muted text-muted-foreground';
      case 'past-clients': return 'bg-accent text-accent-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Hello! 👋</h1>
            <p className="text-muted-foreground mt-1">Here's a summary of your activity</p>
          </div>
          <Button
            onClick={exportToExcel}
            disabled={isExporting}
            className="gap-2 w-full sm:w-auto"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export to Excel
          </Button>
        </div>

        {/* Export Reminder */}
        {showExportReminder && (
          <div className="mb-6 bg-primary/5 border border-primary/20 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 text-primary shrink-0" />
              <p className="text-sm text-foreground">
                Reminder: It's a good idea to export a data backup to Excel 📋
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                onClick={() => {
                  exportToExcel();
                  dismissExportReminder();
                }}
                disabled={isExporting}
                className="gap-1.5"
              >
                {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                Export
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                onClick={dismissExportReminder}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        <div className="sticky top-0 z-40 bg-background pb-4 mb-4 -mx-4 px-4 sm:-mx-6 sm:px-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-11 h-12 text-base"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Search Results */}
          {searchTerm.length >= 2 && (
            <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
              {searchResults.length > 0 ? (
                <div className="p-2">
                  {searchResults.map((result) => (
                    <div
                      key={`${result.location}-${result.id}`}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors gap-2"
                      onClick={() => {
                        navigate(result.navigateTo);
                        setSearchTerm('');
                        setSearchResults([]);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {result.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{result.name}</p>
                          <p className="text-sm text-muted-foreground">{result.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getLocationColor(result.location)}`}>
                          {getLocationIcon(result.location)}
                          {result.locationLabel}
                        </span>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !isSearching ? (
                <div className="p-6 text-center text-muted-foreground">
                  No results found
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div 
            onClick={() => navigate('/students')}
            className="cursor-pointer"
          >
            <StatCard
              title="Active Students"
              value={activeStudentsCount}
              icon={GraduationCap}
            />
          </div>
          <div 
            onClick={() => navigate('/students?filter=attention')}
            className="cursor-pointer"
          >
            <StatCard
              title="Needs Attention"
              value={studentsNeedingAttention.length + pendingPaymentProjects.length}
              icon={AlertTriangle}
              className={(studentsNeedingAttention.length + pendingPaymentProjects.length) > 0 ? 'border-warning bg-warning/5' : ''}
            />
          </div>
          <div 
            onClick={() => setShowNewStudentsDialog(true)}
            className="cursor-pointer"
          >
            <StatCard
              title="New Students This Month"
              value={totalNewStudentsThisMonth}
              icon={UserCheck}
              description={totalNewStudentsThisMonth > 0 ? `${activeNewStudents.length} Active • ${pastClientsNew.length} Alumni • ${didNotContinueNew.length} Closed/Lost` : undefined}
            />
          </div>
        </div>

        {/* Recently Signed Agreements Notification */}
        {recentAgreements.length > 0 && (
          <div className="mb-8 bg-success/10 border border-success/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileCheck className="h-5 w-5 text-success" />
              <h2 className="text-lg font-semibold text-foreground">Recently Signed Agreements</h2>
            </div>
            <div className="space-y-2">
              {recentAgreements.map((agreement) => (
                <div 
                  key={agreement.id} 
                  className="flex items-center justify-between bg-card rounded-lg px-4 py-3 border border-border/50 animate-fade-in"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-success/20 flex items-center justify-center">
                      <Check className="h-4 w-4 text-success" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{agreement.studentName}</p>
                      <p className="text-xs text-muted-foreground">
                        Signed on {format(agreement.signedAt, 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => dismissAgreementMutation.mutate(agreement.id)}
                    title="Dismiss notification"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Website Leads Banner */}
        {newWebsiteLeads.length > 0 && (
          <div className="mb-8 bg-primary/10 border border-primary/30 rounded-xl p-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {newWebsiteLeads.length === 1 
                      ? 'New inquiry from website!' 
                      : `${newWebsiteLeads.length} new inquiries from website!`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {newWebsiteLeads.map(l => l.name).join(', ')}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 shrink-0"
                onClick={() => {
                  const year = newWebsiteLeads[0]?.leads_year;
                  navigate(year ? `/leads/${year}` : '/leads/27');
                }}
              >
                <UserPlus className="h-3.5 w-3.5" />
                View Inquiries
              </Button>
            </div>
          </div>
        )}

        {/* Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Students Needing Attention */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Needs Attention ({studentsNeedingAttention.length + pendingPaymentProjects.length})
              </h2>
              <Link to="/students?filter=attention" className="text-sm text-primary hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {studentsNeedingAttention.length > 0 ? (
                studentsNeedingAttention.map((student, index) => {
                  const daysSinceCreation = differenceInDays(new Date(), new Date(student.createdAt));
                  const needsAgreementReminder = !student.signedAgreement && daysSinceCreation >= 4;
                  const needsPaymentReminder = !student.isPaid && daysSinceCreation >= 4;
                  
                  return (
                    <div key={student.id} className="animate-slide-up relative group" style={{ animationDelay: `${index * 50}ms` }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDismiss(student.id);
                        }}
                        title="Remove from 'needs attention' list"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <div 
                        className="cursor-pointer"
                        onClick={() => setEditingStudent(student as Student)}
                      >
                        <StudentRow student={student as Student} showActions={false} />
                      </div>
                      {/* Attention reasons */}
                      <div className="flex gap-2 mt-2 ml-4">
                        {needsPaymentReminder && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-destructive/10 text-destructive">
                            <DollarSign className="h-3 w-3" />
                            Not paid
                          </span>
                        )}
                        {needsAgreementReminder && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-warning/10 text-warning">
                            Agreement not signed
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : pendingPaymentProjects.length === 0 ? (
                <div className="text-center py-8 bg-card rounded-xl border border-border/50">
                  <p className="text-muted-foreground">🎉 No students requiring attention</p>
                </div>
              ) : null}

              {/* Pending Payment Projects */}
              {pendingPaymentProjects.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-warning" />
                    Pending Payment Collaborations ({pendingPaymentProjects.length})
                  </h3>
                  {pendingPaymentProjects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-3 bg-warning/10 rounded-lg mb-2 cursor-pointer hover:bg-warning/20 transition-colors"
                      onClick={() => navigate('/projects')}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-warning/20 flex items-center justify-center">
                          <DollarSign className="h-4 w-4 text-warning" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">{project.name}</p>
                          {project.collaborationName && (
                            <p className="text-xs text-muted-foreground">{project.collaborationName}</p>
                          )}
                        </div>
                      </div>
                      {project.amount != null && (
                        <span className="text-sm font-medium text-foreground">${project.amount.toLocaleString()}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Students */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Recent Students</h2>
              <Link to="/students" className="text-sm text-primary hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {recentStudents.map((student, index) => (
                <div 
                  key={student.id} 
                  className="animate-slide-up cursor-pointer" 
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => setEditingStudent(student as Student)}
                >
                  <StudentRow student={student as Student} showActions={false} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Edit Student Dialog */}
        <EditStudentDialog
          student={editingStudent}
          open={!!editingStudent}
          onOpenChange={(open) => !open && setEditingStudent(null)}
          onSave={handleEditStudent}
        />

        {/* New Students This Month Dialog */}
        <Dialog open={showNewStudentsDialog} onOpenChange={setShowNewStudentsDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                New Students This Month ({totalNewStudentsThisMonth})
              </DialogTitle>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto space-y-4">
              {/* Active Students */}
              {activeNewStudents.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-success"></div>
                    Active Students ({activeNewStudents.length})
                  </h3>
                  <div className="space-y-1">
                    {activeNewStudents.map((student) => (
                      <div 
                        key={student.id}
                        className="flex items-center justify-between p-2 bg-success/10 rounded-lg hover:bg-success/20 cursor-pointer transition-colors"
                        onClick={() => {
                          setShowNewStudentsDialog(false);
                          navigate(`/students?highlight=${student.id}`);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-success/20 flex items-center justify-center text-success font-bold text-xs">
                            {student.name.charAt(0)}
                          </div>
                          <span className="font-medium text-sm">{student.name}</span>
                        </div>
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Past Clients */}
              {pastClientsNew.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                    Alumni ({pastClientsNew.length})
                  </h3>
                  <div className="space-y-1">
                    {pastClientsNew.map((student) => (
                      <div 
                        key={student.id}
                        className="flex items-center justify-between p-2 bg-primary/10 rounded-lg hover:bg-primary/20 cursor-pointer transition-colors"
                        onClick={() => {
                          setShowNewStudentsDialog(false);
                          navigate(`/past-clients/${student.graduation_year}?highlight=${student.id}`);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-medium text-sm">{student.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">({student.graduation_year})</span>
                          </div>
                        </div>
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Did Not Continue */}
              {didNotContinueNew.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-destructive"></div>
                    Closed/Lost ({didNotContinueNew.length})
                  </h3>
                  <div className="space-y-1">
                    {didNotContinueNew.map((student) => (
                      <div 
                        key={student.id}
                        className="flex items-center justify-between p-2 bg-destructive/10 rounded-lg hover:bg-destructive/20 cursor-pointer transition-colors"
                        onClick={() => {
                          setShowNewStudentsDialog(false);
                          navigate(`/did-not-continue?highlight=${student.id}`);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-destructive/20 flex items-center justify-center text-destructive font-bold text-xs">
                            {student.name.charAt(0)}
                          </div>
                          <span className="font-medium text-sm">{student.name}</span>
                        </div>
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {totalNewStudentsThisMonth === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No new students this month
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
