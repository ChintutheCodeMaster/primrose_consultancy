import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { StudentRow } from '@/components/students/StudentRow';
import { EditStudentDialog } from '@/components/students/EditStudentDialog';
import { ImportExcelDialog, ImportedStudent } from '@/components/students/ImportExcelDialog';
import { ReviewImportDialog, ParsedClient } from '@/components/students/ReviewImportDialog';
import { GlobalSearchInput } from '@/components/search/GlobalSearchInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Upload, ArrowUpDown, X } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Student, DegreeType, degreeTypeLabels } from '@/types/crm';
import { toast } from 'sonner';

export default function PastClients() {
  const { year } = useParams<{ year: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [advisorFilter, setAdvisorFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [degreeFilter, setDegreeFilter] = useState<DegreeType | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [costFilter, setCostFilter] = useState<string>('all');
  const [acceptedFilter, setAcceptedFilter] = useState<string>('all');
  const [universityFilter, setUniversityFilter] = useState<string>('all');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [reviewClients, setReviewClients] = useState<ParsedClient[]>([]);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [highlightedStudentId, setHighlightedStudentId] = useState<string | null>(null);
  const studentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const { data: pastClients = [], isLoading } = useQuery({
    queryKey: ['past-clients', year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          accepted_universities (*)
        `)
        .eq('graduation_year', year);
      
      if (error) throw error;
      
      return (data || []).map((student): Student => ({
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        degreeType: (student.degree_type === 'doctorate' ? 'phd' : student.degree_type) as 'bachelor' | 'master' | 'phd',
        interestedCountry: student.interested_country || '',
        interestedField: student.interested_field || '',
        source: student.source || '',
        meetingSummary: student.meeting_summary || '',
        createdAt: new Date(student.created_at),
        status: student.status as 'active' | 'accepted' | 'enrolled' | 'graduated' | 'paused',
        advisorName: student.advisor_name || '',
         paymentType: (student.payment_type as 'hourly' | 'package' | 'other') || 'package',
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
          acceptanceLetterUrl: uni.acceptance_letter_url
        })),
        startDate: student.start_date ? new Date(student.start_date) : undefined
      }));
    }
  });

  // Handle highlight parameter for scrolling to specific student
  useEffect(() => {
    const studentId = searchParams.get('highlight');
    if (studentId) {
      setHighlightedStudentId(studentId);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('highlight');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Scroll to highlighted student when data loads
  useEffect(() => {
    if (highlightedStudentId && !isLoading && pastClients.length > 0) {
      const element = studentRefs.current[highlightedStudentId];
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        setTimeout(() => {
          setHighlightedStudentId(null);
        }, 3000);
      }
    }
  }, [highlightedStudentId, isLoading, pastClients]);

  // Extract unique values for filter options
  const filterOptions = useMemo(() => {
    const advisors = [...new Set(pastClients.map(s => s.advisorName).filter(Boolean))];
    const sources = [...new Set(pastClients.map(s => s.source).filter(Boolean))];
    const universities = [...new Set([
      ...pastClients.map(s => s.targetUniversity).filter(Boolean),
      ...pastClients.flatMap(s => s.acceptedUniversities.map(u => u.name)).filter(Boolean),
    ])].sort();
    return { advisors, sources, universities };
  }, [pastClients]);

  // Check if any filter is active
  const hasActiveFilters = advisorFilter !== 'all' || paymentFilter !== 'all' || 
    degreeFilter !== 'all' || sourceFilter !== 'all' || costFilter !== 'all' || 
    acceptedFilter !== 'all' || universityFilter !== 'all';

  const clearAllFilters = () => {
    setAdvisorFilter('all');
    setPaymentFilter('all');
    setDegreeFilter('all');
    setSourceFilter('all');
    setCostFilter('all');
    setAcceptedFilter('all');
    setUniversityFilter('all');
  };

  const filteredClients = useMemo(() => {
    const filtered = pastClients.filter(student => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = student.name.toLowerCase().includes(search) || 
             (student.email?.toLowerCase() || '').includes(search) || 
             (student.phone || '').includes(searchTerm) ||
             student.targetUniversity?.toLowerCase().includes(search) ||
             student.targetCountry?.toLowerCase().includes(search);
      
      const matchesAdvisor = advisorFilter === 'all' || student.advisorName === advisorFilter;
      const matchesPayment = paymentFilter === 'all' || 
        (paymentFilter === 'paid' && student.isPaid) || 
        (paymentFilter === 'unpaid' && !student.isPaid);
      const matchesDegree = degreeFilter === 'all' || student.degreeType === degreeFilter;
      const matchesSource = sourceFilter === 'all' || student.source === sourceFilter;
      const matchesCost = costFilter === 'all' ||
        (costFilter === 'under5k' && student.packageCost < 5000) ||
        (costFilter === '5k-10k' && student.packageCost >= 5000 && student.packageCost < 10000) ||
        (costFilter === '10k-20k' && student.packageCost >= 10000 && student.packageCost <= 20000) ||
        (costFilter === 'over20k' && student.packageCost > 20000);
      const matchesAccepted = acceptedFilter === 'all' ||
        (acceptedFilter === 'yes' && student.acceptedUniversities.length > 0) ||
        (acceptedFilter === 'no' && student.acceptedUniversities.length === 0);
      const matchesUniversity = universityFilter === 'all' ||
        student.targetUniversity === universityFilter ||
        student.acceptedUniversities.some(u => u.name === universityFilter);
      
      return matchesSearch && matchesAdvisor && matchesPayment && matchesDegree && 
             matchesSource && matchesCost && matchesAccepted && matchesUniversity;
    });
    
    return filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [pastClients, searchTerm, advisorFilter, paymentFilter, degreeFilter, sourceFilter, costFilter, acceptedFilter, sortOrder]);

  const handleEditStudent = async (updatedStudent: Student) => {
    // Get current student to check if isPaid status changed
    const currentStudent = pastClients.find(s => s.id === updatedStudent.id);
    const isPaidChanged = currentStudent && !currentStudent.isPaid && updatedStudent.isPaid;
    
    const updateData: any = {
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
      program: updatedStudent.program
    };

    // If amount_paid > 0, set payment_date to today (tracks when payment was entered)
    if (updatedStudent.amountPaid && updatedStudent.amountPaid > 0) {
      updateData.payment_date = new Date().toISOString().split('T')[0];
    }
    // If isPaid is being set to false or amount is 0, clear the payment_date
    if (!updatedStudent.isPaid || !updatedStudent.amountPaid || updatedStudent.amountPaid <= 0) {
      updateData.payment_date = null;
    }

    const { error } = await supabase
      .from('students')
      .update(updateData)
      .eq('id', updatedStudent.id);
    
    if (error) {
      console.error('Error updating student:', error);
      toast.error('שגיאה בעדכון הסטודנט');
      return;
    }
    
    queryClient.invalidateQueries({ queryKey: ['past-clients', year] });
    toast.success('הסטודנט עודכן בהצלחה!');
  };

  const handleDeleteStudent = async (studentId: string) => {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', studentId);
    
    if (error) {
      toast.error('שגיאה במחיקת הסטודנט');
      return;
    }
    
    queryClient.invalidateQueries({ queryKey: ['past-clients', year] });
    toast.success('הסטודנט נמחק בהצלחה');
  };

  const handleRestoreToStudent = async (studentId: string) => {
    const { error } = await supabase
      .from('students')
      .update({ graduation_year: null, status: 'active' })
      .eq('id', studentId);
    
    if (error) {
      toast.error('שגיאה בהחזרת הסטודנט');
      return;
    }
    
    queryClient.invalidateQueries({ queryKey: ['past-clients', year] });
    queryClient.invalidateQueries({ queryKey: ['students'] });
    toast.success('הסטודנט הוחזר לרשימת הסטודנטים הפעילים');
  };

  const handleImportStudents = async (students: ImportedStudent[]) => {
    const studentsToInsert = students.map(student => ({
      name: student.name,
      email: student.email,
      phone: student.phone,
      graduation_year: student.graduationYear,
      degree_type: student.degreeType || 'bachelor',
      target_country: student.targetCountry || null,
      target_university: student.targetUniversity || null,
      program: student.program || null,
      package_cost: student.packageCost || 0,
      amount_paid: student.amountPaid || 0,
      advisor_name: student.advisorName || null,
      source: student.source || null,
      status: 'graduated',
      is_paid: (student.amountPaid || 0) >= (student.packageCost || 0),
      signed_agreement: true,
    }));

    const { error } = await supabase
      .from('students')
      .insert(studentsToInsert);

    if (error) {
      console.error('Error importing students:', error);
      throw error;
    }

    queryClient.invalidateQueries({ queryKey: ['past-clients', year] });
    toast.success(`${students.length} לקוחות יובאו בהצלחה!`);
  };

  const handleReviewImport = async (clients: ParsedClient[]) => {
    const studentsToInsert = clients.map(client => ({
      name: client.name,
      email: client.email || 'לא צוין',
      phone: client.phone || 'לא צוין',
      graduation_year: year || '2026',
      degree_type: client.degreeType || 'bachelor',
      target_university: client.acceptedTo || null,
      package_cost: 0,
      amount_paid: client.amountPaid || 0,
      advisor_name: client.advisorName || null,
      source: client.source || null,
      meeting_summary: client.meetingSummary || null,
      package_notes: client.packageNotes || null,
      status: 'graduated',
      is_paid: true,
      signed_agreement: true,
    }));

    const { error } = await supabase
      .from('students')
      .insert(studentsToInsert);

    if (error) {
      console.error('Error importing students:', error);
      toast.error('שגיאה בייבוא הלקוחות');
      throw error;
    }

    queryClient.invalidateQueries({ queryKey: ['past-clients', year] });
    toast.success(`${clients.length} לקוחות יובאו בהצלחה!`);
    setShowReviewDialog(false);
  };

  return (
    <MainLayout>
      <div className="animate-fade-in">
        {/* Sticky Header and Search - Only search is sticky */}
        <div className="sticky top-0 z-10 bg-background pb-4 -mx-4 px-4 lg:-mx-8 lg:px-8 pt-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">לקוחות עבר {year}</h1>
              <p className="text-muted-foreground mt-1">סטודנטים שסיימו תהליך בשנת {year} ({filteredClients.length})</p>
            </div>
            <Button onClick={() => setShowImportDialog(true)}>
              <Upload className="h-4 w-4 ml-2" />
              ייבוא מאקסל
            </Button>
          </div>

          {/* Search - Only this stays sticky */}
          <GlobalSearchInput
            placeholder="חיפוש לפי שם, אימייל, טלפון, אוניברסיטה או מדינה..."
            localSearchTerm={searchTerm}
            onLocalSearchChange={setSearchTerm}
            currentPage="past-clients"
            className="flex-1"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'newest' | 'oldest')}>
            <SelectTrigger className="w-full sm:w-40">
              <ArrowUpDown className="h-4 w-4 ml-2" />
              <SelectValue placeholder="מיון" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">מהחדש לישן</SelectItem>
              <SelectItem value="oldest">מהישן לחדש</SelectItem>
            </SelectContent>
          </Select>

          <Select value={advisorFilter} onValueChange={setAdvisorFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="כל היועצים" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל היועצים</SelectItem>
              {filterOptions.advisors.map(advisor => (
                <SelectItem key={advisor} value={advisor}>{advisor}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="סטטוס תשלום" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל סטטוסי התשלום</SelectItem>
              <SelectItem value="paid">שולם</SelectItem>
              <SelectItem value="unpaid">לא שולם</SelectItem>
            </SelectContent>
          </Select>

          <Select value={degreeFilter} onValueChange={(v) => setDegreeFilter(v as DegreeType | 'all')}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="סוג תואר" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל סוגי התואר</SelectItem>
              {Object.entries(degreeTypeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="מקור" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל המקורות</SelectItem>
              {filterOptions.sources.map(source => (
                <SelectItem key={source} value={source}>{source}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={costFilter} onValueChange={setCostFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="עלות" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל העלויות</SelectItem>
              <SelectItem value="under5k">עד ₪5,000</SelectItem>
              <SelectItem value="5k-10k">₪5,000 - ₪10,000</SelectItem>
              <SelectItem value="10k-20k">₪10,000 - ₪20,000</SelectItem>
              <SelectItem value="over20k">מעל ₪20,000</SelectItem>
            </SelectContent>
          </Select>

          <Select value={acceptedFilter} onValueChange={setAcceptedFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="קבלה" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">הכל</SelectItem>
              <SelectItem value="yes">התקבל לאוניברסיטה</SelectItem>
              <SelectItem value="no">טרם התקבל</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-muted-foreground">
              <X className="h-4 w-4 ml-1" />
              נקה סינון
            </Button>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">טוען...</p>
          </div>
        )}

        {/* Past Clients List */}
        {!isLoading && (
          <div className="space-y-4">
            {filteredClients.map((student, index) => (
              <div 
                key={student.id} 
                ref={(el) => { studentRefs.current[student.id] = el; }}
                className={`animate-slide-up scroll-mt-40 transition-all duration-500 ${highlightedStudentId === student.id ? 'ring-2 ring-primary ring-offset-2 rounded-2xl' : ''}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <StudentRow 
                  student={student} 
                  onEdit={() => setEditingStudent(student)}
                  showActions={true}
                  onRestoreToStudent={() => handleRestoreToStudent(student.id)}
                  onDelete={() => handleDeleteStudent(student.id)}
                />
              </div>
            ))}
          </div>
        )}

        <EditStudentDialog
          student={editingStudent}
          open={!!editingStudent}
          onOpenChange={(open) => !open && setEditingStudent(null)}
          onSave={handleEditStudent}
        />

        <ImportExcelDialog
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          onImport={handleImportStudents}
          graduationYear={year || new Date().getFullYear().toString()}
        />

        <ReviewImportDialog
          open={showReviewDialog}
          onOpenChange={setShowReviewDialog}
          clients={reviewClients}
          onImport={handleReviewImport}
          graduationYear={year || '2026'}
        />

        {!isLoading && filteredClients.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">אין לקוחות עבר לשנת {year}</p>
            <p className="text-sm text-muted-foreground mt-2">
              כדי להעביר סטודנט לכאן, לחץ על "העבר ללקוח עבר" בעמוד הסטודנטים
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
