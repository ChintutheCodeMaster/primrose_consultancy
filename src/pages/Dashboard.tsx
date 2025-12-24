import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/ui/stat-card';
import { StudentRow } from '@/components/students/StudentRow';
import { GraduationCap, AlertTriangle, DollarSign, UserCheck, X, Loader2, Search, ExternalLink, UserPlus, Users, History, Download } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { differenceInDays, format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

  // Export all data to Excel
  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      // Fetch all leads
      const { data: leads } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch all students with accepted universities
      const { data: students } = await supabase
        .from('students')
        .select('*, accepted_universities(*)')
        .order('created_at', { ascending: false });

      // Fetch all advisors
      const { data: advisors } = await supabase
        .from('advisors')
        .select('*')
        .order('name', { ascending: true });

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Leads sheet
      if (leads && leads.length > 0) {
        const leadsData = leads.map(l => ({
          'שם': l.name,
          'אימייל': l.email,
          'טלפון': l.phone,
          'סטטוס': l.status,
          'סוג תואר': l.degree_type,
          'תחום עניין': l.interested_field || '',
          'מדינה מועדפת': l.interested_country || '',
          'מקור': l.source || '',
          'סיכום פגישה': l.meeting_summary || '',
          'לא המשיך': l.did_not_continue ? 'כן' : 'לא',
          'תאריך יצירה': l.created_at ? format(new Date(l.created_at), 'dd/MM/yyyy') : '',
          'קשר אחרון': l.last_contact_at ? format(new Date(l.last_contact_at), 'dd/MM/yyyy') : '',
        }));
        const leadsSheet = XLSX.utils.json_to_sheet(leadsData);
        XLSX.utils.book_append_sheet(wb, leadsSheet, 'מתעניינים');
      }

      // Students sheet
      if (students && students.length > 0) {
        const studentsData = students.map(s => ({
          'שם': s.name,
          'אימייל': s.email,
          'טלפון': s.phone,
          'סטטוס': s.status,
          'סוג תואר': s.degree_type,
          'תחום עניין': s.interested_field || '',
          'מדינה מועדפת': s.interested_country || '',
          'מדינת יעד': s.target_country || '',
          'אוניברסיטת יעד': s.target_university || '',
          'תוכנית': s.program || '',
          'שנת סיום': s.graduation_year || '',
          'מקור': s.source || '',
          'יועץ': s.advisor_name || '',
          'עלות חבילה': s.package_cost || 0,
          'סכום ששולם': s.amount_paid || 0,
          'שולם': s.is_paid ? 'כן' : 'לא',
          'הערות תשלום': s.payment_notes || '',
          'הסכם נחתם': s.signed_agreement ? 'כן' : 'לא',
          'סיכום פגישה': s.meeting_summary || '',
          'לא המשיך': s.did_not_continue ? 'כן' : 'לא',
          'אוניברסיטאות מקבלות': s.accepted_universities?.map((u: any) => u.name).join(', ') || '',
          'תאריך יצירה': s.created_at ? format(new Date(s.created_at), 'dd/MM/yyyy') : '',
        }));
        const studentsSheet = XLSX.utils.json_to_sheet(studentsData);
        XLSX.utils.book_append_sheet(wb, studentsSheet, 'סטודנטים');
      }

      // Advisors sheet
      if (advisors && advisors.length > 0) {
        const advisorsData = advisors.map(a => ({
          'שם': a.name,
          'אימייל': a.email || '',
          'טלפון': a.phone || '',
          'פעיל': a.is_active ? 'כן' : 'לא',
          'סוג תשלום': a.payment_type || '',
          'סכום תשלום': a.payment_amount || 0,
          'הערות תשלום': a.payment_notes || '',
          'הערות': a.notes || '',
        }));
        const advisorsSheet = XLSX.utils.json_to_sheet(advisorsData);
        XLSX.utils.book_append_sheet(wb, advisorsSheet, 'יועצים');
      }

      // Download file
      const fileName = `נתונים_${format(new Date(), 'dd-MM-yyyy')}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: "הקובץ הורד בהצלחה",
        description: `הקובץ ${fileName} נשמר במחשב שלך`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "שגיאה בייצוא",
        description: "לא ניתן היה לייצא את הנתונים",
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
              locationLabel: 'לא המשיכו (מתעניין)',
              navigateTo: '/did-not-continue'
            });
          } else {
            results.push({
              id: lead.id,
              name: lead.name,
              email: lead.email,
              phone: lead.phone,
              location: 'leads',
              locationLabel: 'מתעניינים',
              navigateTo: '/leads'
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
              locationLabel: 'לא המשיכו (סטודנט)',
              navigateTo: '/did-not-continue'
            });
          } else if (student.graduation_year) {
            results.push({
              id: student.id,
              name: student.name,
              email: student.email,
              phone: student.phone,
              location: 'past-clients',
              locationLabel: `לקוחות עבר ${student.graduation_year}`,
              navigateTo: `/past-clients/${student.graduation_year}`,
              year: student.graduation_year
            });
          } else {
            results.push({
              id: student.id,
              name: student.name,
              email: student.email,
              phone: student.phone,
              location: 'students',
              locationLabel: 'סטודנטים',
              navigateTo: '/students'
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
        .neq('status', 'past_client')
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
        notes: [],
        createdAt: new Date(s.created_at),
        dismissedFromAttention: s.dismissed_from_attention || false,
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
        title: "הוסר מהרשימה",
        description: "הסטודנט הוסר מרשימת דורשי תשומת הלב",
      });
    },
    onError: () => {
      toast({
        title: "שגיאה",
        description: "לא ניתן להסיר את הסטודנט מהרשימה",
        variant: "destructive",
      });
    }
  });

  // Active students count
  const activeStudentsCount = students.filter(s => 
    s.status !== 'graduated'
  ).length;
  
  // Students needing attention
  const studentsNeedingAttention = students.filter(s => {
    if (s.status === 'graduated') return false;
    if (s.dismissedFromAttention) return false;
    
    const daysSinceCreation = differenceInDays(new Date(), new Date(s.createdAt));
    const needsAgreementReminder = !s.signedAgreement && daysSinceCreation >= 4;
    const needsPaymentReminder = !s.isPaid && daysSinceCreation >= 7;
    return needsAgreementReminder || needsPaymentReminder;
  });
  
  // Total income this month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const totalIncomeThisMonth = students
    .filter(s => {
      const createdDate = new Date(s.createdAt);
      return s.isPaid && 
             createdDate.getMonth() === currentMonth && 
             createdDate.getFullYear() === currentYear;
    })
    .reduce((sum, s) => sum + (s.packageCost || 0), 0);
  
  // Conversions this month
  const conversionsThisMonth = students.filter(s => {
    const createdDate = new Date(s.createdAt);
    return createdDate.getMonth() === currentMonth && 
           createdDate.getFullYear() === currentYear;
  }).length;

  const recentStudents = students
    .filter(s => s.status !== 'graduated')
    .slice(0, 3);

  const handleDismiss = (studentId: string) => {
    dismissMutation.mutate(studentId);
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
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">שלום! 👋</h1>
            <p className="text-muted-foreground mt-1">הנה סיכום הפעילות שלך</p>
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
            ייצוא לאקסל
          </Button>
        </div>

        {/* Global Search */}
        <div className="mb-8 relative">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="חיפוש לפי שם, אימייל או טלפון..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pr-11 h-12 text-base"
            />
            {isSearching && (
              <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
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
                      className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
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
                  לא נמצאו תוצאות
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="סטודנטים פעילים"
            value={activeStudentsCount}
            icon={GraduationCap}
          />
          <div 
            onClick={() => navigate('/students?filter=attention')}
            className="cursor-pointer"
          >
            <StatCard
              title="דורשים תשומת לב"
              value={studentsNeedingAttention.length}
              icon={AlertTriangle}
              className={studentsNeedingAttention.length > 0 ? 'border-warning bg-warning/5' : ''}
            />
          </div>
          <StatCard
            title="הכנסות החודש"
            value={`₪${totalIncomeThisMonth.toLocaleString()}`}
            icon={DollarSign}
          />
          <StatCard
            title="המרות החודש"
            value={conversionsThisMonth}
            icon={UserCheck}
          />
        </div>

        {/* Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Students Needing Attention */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                דורשים תשומת לב ({studentsNeedingAttention.length})
              </h2>
              <Link to="/students?filter=attention" className="text-sm text-primary hover:underline">
                הצג הכל
              </Link>
            </div>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {studentsNeedingAttention.length > 0 ? (
                studentsNeedingAttention.map((student, index) => (
                  <div key={student.id} className="animate-slide-up relative group" style={{ animationDelay: `${index * 50}ms` }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDismiss(student.id);
                      }}
                      title="הסר מרשימת דורשי תשומת לב"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <StudentRow student={student as Student} showActions={false} />
                  </div>
                ))
              ) : (
                <div className="text-center py-8 bg-card rounded-xl border border-border/50">
                  <p className="text-muted-foreground">🎉 אין סטודנטים שדורשים תשומת לב</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Students */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">סטודנטים אחרונים</h2>
              <Link to="/students" className="text-sm text-primary hover:underline">
                הצג הכל
              </Link>
            </div>
            <div className="space-y-4">
              {recentStudents.map((student, index) => (
                <div key={student.id} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                  <StudentRow student={student as Student} showActions={false} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
