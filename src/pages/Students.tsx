import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { StudentRow } from '@/components/students/StudentRow';
import { AddStudentDialog } from '@/components/students/AddStudentDialog';
import { mockStudents } from '@/data/mockData';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, X } from 'lucide-react';
import { Student, StudentStatus, studentStatusLabels, degreeTypeLabels, DegreeType } from '@/types/crm';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export default function Students() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>(mockStudents);
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
    fieldFilter !== 'all' || sourceFilter !== 'all' || costFilter !== 'all' || acceptedFilter !== 'all';

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
  };

  // Sort by creation date, newest first - exclude graduated students
  const sortedStudents = [...students]
    .filter(s => s.status !== 'graduated')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filteredStudents = sortedStudents.filter(student => {
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
    
    return matchesSearch && matchesStatus && matchesAdvisor && matchesPayment && 
           matchesCountry && matchesDegree && matchesField && matchesSource && 
           matchesCost && matchesAccepted;
  });

  const handleAddStudent = (newStudent: Omit<Student, 'id' | 'createdAt' | 'notes' | 'documents'>) => {
    const student: Student = {
      ...newStudent,
      id: String(students.length + 1),
      createdAt: new Date(),
      notes: [],
      documents: [],
    };
    setStudents([student, ...students]);
    toast.success('הסטודנט נוסף בהצלחה!');
  };

  const handleMoveToPastClient = (studentId: string, year: string) => {
    setStudents(students.map(s => 
      s.id === studentId 
        ? { ...s, status: 'graduated' as StudentStatus, createdAt: new Date(`${year}-01-01`) }
        : s
    ));
    toast.success(`הסטודנט הועבר ללקוחות עבר ${year}`);
    navigate(`/past-clients/${year}`);
  };

  return (
    <MainLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">סטודנטים</h1>
            <p className="text-muted-foreground mt-1">ניהול סטודנטים בליווי ({filteredStudents.length})</p>
          </div>
          <AddStudentDialog onAdd={handleAddStudent} />
        </div>

        {/* Search */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="חיפוש לפי שם, אימייל, טלפון, אוניברסיטה או תחום..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearAllFilters} className="gap-2">
                <X className="h-4 w-4" />
                נקה סינונים
              </Button>
            )}
          </div>

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
          </div>
        </div>

        {/* Students List */}
        <div className="space-y-4">
          {filteredStudents.map((student, index) => (
            <div key={student.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
              <StudentRow 
                student={student} 
                onMoveToPastClient={(year) => handleMoveToPastClient(student.id, year)}
              />
            </div>
          ))}
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">לא נמצאו סטודנטים</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
