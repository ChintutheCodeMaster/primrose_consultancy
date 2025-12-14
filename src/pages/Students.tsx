import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { StudentRow } from '@/components/students/StudentRow';
import { AddStudentDialog } from '@/components/students/AddStudentDialog';
import { mockStudents } from '@/data/mockData';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { Student, StudentStatus, studentStatusLabels } from '@/types/crm';
import { toast } from 'sonner';

export default function Students() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StudentStatus | 'all'>('all');

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
    return matchesSearch && matchesStatus;
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
            <p className="text-muted-foreground mt-1">ניהול סטודנטים בליווי</p>
          </div>
          <AddStudentDialog onAdd={handleAddStudent} />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש לפי שם, אימייל, טלפון, אוניברסיטה או תחום..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StudentStatus | 'all')}>
            <SelectTrigger className="w-full sm:w-48">
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
