import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { StudentRow } from '@/components/students/StudentRow';
import { AddStudentDialog } from '@/components/students/AddStudentDialog';
import { EditStudentDialog } from '@/components/students/EditStudentDialog';
import { GlobalSearchInput } from '@/components/search/GlobalSearchInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, ArrowUpDown } from 'lucide-react';
import { Student, StudentStatus, studentStatusLabels, degreeTypeLabels, DegreeType } from '@/types/crm';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { differenceInDays } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function Students() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StudentStatus | 'all'>('all');
  const [advisorFilter, setAdvisorFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [degreeFilter, setDegreeFilter] = useState<DegreeType | 'all'>('all');
  const [fieldFilter, setFieldFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [costFilter, setCostFilter] = useState<string>('all');
  const [acceptedFilter, setAcceptedFilter] = useState<string>('all');
  const [attentionFilter, setAttentionFilter] = useState<boolean>(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [highlightedStudentId, setHighlightedStudentId] = useState<string | null>(null);
  const studentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Fetch students from Supabase
  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          accepted_universities (*)
        `)
        .is('graduation_year', null)
        .eq('did_not_continue', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((student): Student & { amountPaid: number } => ({
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        degreeType: (student.degree_type === 'doctorate' ? 'phd' : student.degree_type) as DegreeType,
        interestedCountry: student.interested_country || '',
        interestedField: student.interested_field || '',
        source: student.source || '',
        meetingSummary: student.meeting_summary || '',
        packageNotes: student.package_notes || '',
        createdAt: new Date(student.created_at),
        status: student.status as StudentStatus,
        advisorId: student.advisor_id || undefined,
        advisorName: student.advisor_name || '',
        paymentType: (student.payment_type as 'hourly' | 'package' | 'other') || 'package',
        packageCost: Number(student.package_cost) || 0,
        amountPaid: Number(student.amount_paid) || 0,
        paymentNotes: student.payment_notes || '',
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
        startDate: student.start_date ? new Date(student.start_date) : undefined,
        paymentReminderDate: student.payment_reminder_date ? new Date(student.payment_reminder_date) : undefined
      }));
    }
  });

  // Mutation to move student to past clients
  const moveToPastClientMutation = useMutation({
    mutationFn: async ({ studentId, year }: { studentId: string; year: string }) => {
      const { error } = await supabase
        .from('students')
        .update({ graduation_year: year })
        .eq('id', studentId);
      
      if (error) throw error;
      return { studentId, year };
    },
    onSuccess: ({ year }) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['past-clients'] });
      toast.success(`הסטודנט הועבר ללקוחות עבר ${year}`);
      navigate(`/past-clients/${year}`);
    },
    onError: (error) => {
      console.error('Error moving student:', error);
      toast.error('שגיאה בהעברת הסטודנט');
    }
  });

  // Handle URL filter parameter
  useEffect(() => {
    if (searchParams.get('filter') === 'attention') {
      setAttentionFilter(true);
    }
    
    // Handle highlight parameter for scrolling to specific student
    const studentId = searchParams.get('highlight');
    if (studentId) {
      setHighlightedStudentId(studentId);
      // Clear the highlight param after setting it
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('highlight');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Scroll to highlighted student when data loads
  useEffect(() => {
    if (highlightedStudentId && !isLoading && students.length > 0) {
      const element = studentRefs.current[highlightedStudentId];
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        // Remove highlight after 3 seconds
        setTimeout(() => {
          setHighlightedStudentId(null);
        }, 3000);
      }
    }
  }, [highlightedStudentId, isLoading, students]);

  // Extract unique values for filter options
  const filterOptions = useMemo(() => {
    const advisors = [...new Set(students.map(s => s.advisorName).filter(Boolean))];
    const countries = [...new Set(students.map(s => s.interestedCountry).filter(Boolean))];
    const fields = [...new Set(students.map(s => s.interestedField).filter(Boolean))];
    const sources = [...new Set(students.map(s => s.source).filter(Boolean))];
    return { advisors, countries, fields, sources };
  }, [students]);

  // Check if any filter is active
  const hasActiveFilters = statusFilter !== 'all' || advisorFilter !== 'all' || 
    paymentFilter !== 'all' || countryFilter !== 'all' || degreeFilter !== 'all' ||
    fieldFilter !== 'all' || sourceFilter !== 'all' || costFilter !== 'all' || 
    acceptedFilter !== 'all' || attentionFilter;

  const clearAllFilters = () => {
    setStatusFilter('all');
    setAdvisorFilter('all');
    setPaymentFilter('all');
    setCountryFilter('all');
    setDegreeFilter('all');
    setFieldFilter('all');
    setSourceFilter('all');
    setCostFilter('all');
    setAcceptedFilter('all');
    setAttentionFilter(false);
    setSearchParams({});
  };

  // Helper to check if student needs attention
  const studentNeedsAttention = (student: Student) => {
    const daysSinceCreation = differenceInDays(new Date(), new Date(student.createdAt));
    const needsAgreementReminder = !student.signedAgreement && daysSinceCreation >= 4;
    const needsPaymentReminder = !student.isPaid && daysSinceCreation >= 7;
    return needsAgreementReminder || needsPaymentReminder;
  };

  const filteredStudents = useMemo(() => {
    const filtered = students.filter(student => {
      const matchesSearch = student.name.includes(searchTerm) || 
                           student.email.includes(searchTerm) || 
                           student.phone.includes(searchTerm) ||
                           student.targetUniversity.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.interestedField.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
      const matchesAdvisor = advisorFilter === 'all' || student.advisorName === advisorFilter;
      const matchesPayment = paymentFilter === 'all' || 
        (paymentFilter === 'paid' && student.isPaid) || 
        (paymentFilter === 'unpaid' && !student.isPaid);
      const matchesCountry = countryFilter === 'all' || student.interestedCountry === countryFilter;
      const matchesDegree = degreeFilter === 'all' || student.degreeType === degreeFilter;
      const matchesField = fieldFilter === 'all' || student.interestedField === fieldFilter;
      const matchesSource = sourceFilter === 'all' || student.source === sourceFilter;
      const matchesCost = costFilter === 'all' ||
        (costFilter === 'under10k' && student.packageCost < 10000) ||
        (costFilter === '10k-20k' && student.packageCost >= 10000 && student.packageCost <= 20000) ||
        (costFilter === 'over20k' && student.packageCost > 20000);
      const matchesAccepted = acceptedFilter === 'all' ||
        (acceptedFilter === 'yes' && student.acceptedUniversities.length > 0) ||
        (acceptedFilter === 'no' && student.acceptedUniversities.length === 0);
      const matchesAttention = !attentionFilter || studentNeedsAttention(student);
      
      return matchesSearch && matchesStatus && matchesAdvisor && matchesPayment && 
             matchesCountry && matchesDegree && matchesField && matchesSource && 
             matchesCost && matchesAccepted && matchesAttention;
    });
    
    // Sort by date
    return filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [students, searchTerm, statusFilter, advisorFilter, paymentFilter, countryFilter, degreeFilter, fieldFilter, sourceFilter, costFilter, acceptedFilter, attentionFilter, sortOrder]);

  const handleAddStudent = async (newStudent: Omit<Student, 'id' | 'createdAt' | 'notes' | 'documents'>) => {
    const { error } = await supabase.from('students').insert({
      name: newStudent.name,
      email: newStudent.email,
      phone: newStudent.phone,
      degree_type: newStudent.degreeType === 'phd' ? 'doctorate' : newStudent.degreeType,
      interested_country: newStudent.interestedCountry,
      interested_field: newStudent.interestedField,
      source: newStudent.source,
      meeting_summary: newStudent.meetingSummary,
      status: newStudent.status,
      advisor_id: newStudent.advisorId || null,
      advisor_name: newStudent.advisorName,
      payment_type: newStudent.paymentType || 'package',
      package_cost: newStudent.packageCost,
      payment_notes: newStudent.paymentNotes,
      is_paid: newStudent.isPaid,
      signed_agreement: newStudent.signedAgreement,
      target_country: newStudent.targetCountry,
      target_university: newStudent.targetUniversity,
      program: newStudent.program
    });
    
    if (error) {
      console.error('Error adding student:', error);
      toast.error('שגיאה בהוספת הסטודנט');
      return;
    }
    
    queryClient.invalidateQueries({ queryKey: ['students'] });
    toast.success('הסטודנט נוסף בהצלחה!');
  };

  const handleMoveToPastClient = (studentId: string, year: string) => {
    moveToPastClientMutation.mutate({ studentId, year });
  };

  const handleEditStudent = async (updatedStudent: Student) => {
    // Get current student to check if isPaid status changed
    const currentStudent = students.find(s => s.id === updatedStudent.id);
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
      package_notes: updatedStudent.packageNotes,
      status: updatedStudent.status,
      advisor_id: updatedStudent.advisorId || null,
      advisor_name: updatedStudent.advisorName,
      payment_type: updatedStudent.paymentType || 'package',
      package_cost: updatedStudent.packageCost,
      payment_notes: updatedStudent.paymentNotes,
      is_paid: updatedStudent.isPaid,
      signed_agreement: updatedStudent.signedAgreement,
      target_country: updatedStudent.targetCountry,
      target_university: updatedStudent.targetUniversity,
      program: updatedStudent.program,
      amount_paid: updatedStudent.amountPaid ?? 0,
      payment_reminder_date: (updatedStudent as any).paymentReminderDate 
        ? (updatedStudent as any).paymentReminderDate.toISOString().split('T')[0]
        : null
    };

    // If isPaid just changed to true, set the payment_date to today
    if (isPaidChanged) {
      updateData.payment_date = new Date().toISOString().split('T')[0];
    }
    // If student is already paid but has no payment_date and amount is being updated, set date now
    else if (updatedStudent.isPaid && currentStudent?.isPaid && updatedStudent.amountPaid && updatedStudent.amountPaid > 0) {
      // Check if current student has no payment_date (we need to fetch this)
      const { data: studentData } = await supabase
        .from('students')
        .select('payment_date')
        .eq('id', updatedStudent.id)
        .maybeSingle();
      
      if (studentData && !studentData.payment_date) {
        updateData.payment_date = new Date().toISOString().split('T')[0];
      }
    }
    // If isPaid is being set to false, clear the payment_date
    if (!updatedStudent.isPaid) {
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
    
    queryClient.invalidateQueries({ queryKey: ['students'] });
    toast.success('הסטודנט עודכן בהצלחה!');
  };

  const handleDidNotContinue = async (studentId: string) => {
    const { error } = await supabase
      .from('students')
      .update({ did_not_continue: true })
      .eq('id', studentId);
    
    if (error) {
      toast.error('שגיאה בעדכון');
      return;
    }
    
    queryClient.invalidateQueries({ queryKey: ['students'] });
    queryClient.invalidateQueries({ queryKey: ['did-not-continue-students'] });
    toast.success('הסטודנט הועבר לרשימת "לא המשיכו"');
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
    
    queryClient.invalidateQueries({ queryKey: ['students'] });
    toast.success('הסטודנט נמחק בהצלחה');
  };

  return (
    <MainLayout>
      <div className="animate-fade-in">
        {/* Sticky Header and Search - Only search is sticky */}
        <div className="sticky top-0 z-10 bg-background pb-4 -mx-4 px-4 lg:-mx-8 lg:px-8 pt-2">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">סטודנטים</h1>
              <p className="text-muted-foreground mt-1">ניהול סטודנטים בליווי ({filteredStudents.length})</p>
            </div>
            <AddStudentDialog onAdd={handleAddStudent} />
          </div>

          {/* Search - Only this stays sticky */}
          <div className="flex gap-4">
            <GlobalSearchInput
              placeholder="חיפוש לפי שם, אימייל, טלפון, אוניברסיטה או תחום..."
              localSearchTerm={searchTerm}
              onLocalSearchChange={setSearchTerm}
              currentPage="students"
              className="flex-1"
            />
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearAllFilters} className="gap-2">
                <X className="h-4 w-4" />
                נקה סינונים
              </Button>
            )}
          </div>
        </div>

        {/* Filters - Not sticky, will scroll with content */}
        <div className="flex flex-col gap-4 mb-4">
          {/* Filter Row 1 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StudentStatus | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="סטטוס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסטטוסים</SelectItem>
                {Object.entries(studentStatusLabels)
                  .filter(([value]) => value !== 'graduated')
                  .map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Select value={advisorFilter} onValueChange={setAdvisorFilter}>
              <SelectTrigger>
                <SelectValue placeholder="יועץ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל היועצים</SelectItem>
                {filterOptions.advisors.map((advisor) => (
                  <SelectItem key={advisor} value={advisor}>{advisor}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="תשלום" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל סטטוסי תשלום</SelectItem>
                <SelectItem value="paid">שולם</SelectItem>
                <SelectItem value="unpaid">לא שולם</SelectItem>
              </SelectContent>
            </Select>

            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="מדינה" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל המדינות</SelectItem>
                {filterOptions.countries.map((country) => (
                  <SelectItem key={country} value={country}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={degreeFilter} onValueChange={(v) => setDegreeFilter(v as DegreeType | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="סוג תואר" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל סוגי התואר</SelectItem>
                {Object.entries(degreeTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filter Row 2 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <Select value={fieldFilter} onValueChange={setFieldFilter}>
              <SelectTrigger>
                <SelectValue placeholder="תחום לימודים" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל התחומים</SelectItem>
                {filterOptions.fields.map((field) => (
                  <SelectItem key={field} value={field}>{field}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="מקור הגעה" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל המקורות</SelectItem>
                {filterOptions.sources.map((source) => (
                  <SelectItem key={source} value={source}>{source}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={costFilter} onValueChange={setCostFilter}>
              <SelectTrigger>
                <SelectValue placeholder="טווח עלות" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל העלויות</SelectItem>
                <SelectItem value="under10k">עד ₪10,000</SelectItem>
                <SelectItem value="10k-20k">₪10,000 - ₪20,000</SelectItem>
                <SelectItem value="over20k">מעל ₪20,000</SelectItem>
              </SelectContent>
            </Select>

            <Select value={acceptedFilter} onValueChange={setAcceptedFilter}>
              <SelectTrigger>
                <SelectValue placeholder="האם התקבל" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">הכל</SelectItem>
                <SelectItem value="yes">התקבל לאוניברסיטה</SelectItem>
                <SelectItem value="no">טרם התקבל</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'newest' | 'oldest')}>
              <SelectTrigger>
                <ArrowUpDown className="h-4 w-4 ml-2" />
                <SelectValue placeholder="מיון" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">מהחדש לישן</SelectItem>
                <SelectItem value="oldest">מהישן לחדש</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">טוען...</p>
          </div>
        )}

        {/* Students List */}
        {!isLoading && (
          <div className="space-y-4">
            {filteredStudents.map((student, index) => (
              <div 
                key={student.id} 
                ref={(el) => { studentRefs.current[student.id] = el; }}
                className={`animate-slide-up scroll-mt-40 transition-all duration-500 ${highlightedStudentId === student.id ? 'ring-2 ring-primary ring-offset-2 rounded-2xl' : ''}`} 
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <StudentRow 
                  student={student}
                  onEdit={() => setEditingStudent(student)}
                  onMoveToPastClient={(year) => handleMoveToPastClient(student.id, year)}
                  onDidNotContinue={() => handleDidNotContinue(student.id)}
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

        {!isLoading && filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">לא נמצאו סטודנטים</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
