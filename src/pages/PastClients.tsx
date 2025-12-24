import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { StudentRow } from '@/components/students/StudentRow';
import { EditStudentDialog } from '@/components/students/EditStudentDialog';
import { ImportExcelDialog, ImportedStudent } from '@/components/students/ImportExcelDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Upload } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Student } from '@/types/crm';
import { toast } from 'sonner';

export default function PastClients() {
  const { year } = useParams<{ year: string }>();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);

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
        status: student.status as 'active' | 'application_phase' | 'accepted' | 'enrolled' | 'graduated' | 'paused',
        advisorName: student.advisor_name || '',
        packageCost: Number(student.package_cost) || 0,
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
          acceptanceLetterUrl: uni.acceptance_letter_url
        })),
        startDate: student.start_date ? new Date(student.start_date) : undefined
      }));
    }
  });

  const filteredClients = pastClients.filter(student => {
    const search = searchTerm.toLowerCase();
    return student.name.toLowerCase().includes(search) || 
           student.email.toLowerCase().includes(search) || 
           student.phone.includes(searchTerm) ||
           student.targetUniversity?.toLowerCase().includes(search) ||
           student.targetCountry?.toLowerCase().includes(search);
  });

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
        payment_notes: updatedStudent.paymentNotes,
        is_paid: updatedStudent.isPaid,
        signed_agreement: updatedStudent.signedAgreement,
        target_country: updatedStudent.targetCountry,
        target_university: updatedStudent.targetUniversity,
        program: updatedStudent.program
      })
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

  return (
    <MainLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">לקוחות עבר {year}</h1>
            <p className="text-muted-foreground mt-1">סטודנטים שסיימו תהליך בשנת {year} ({filteredClients.length})</p>
          </div>
          <Button onClick={() => setShowImportDialog(true)}>
            <Upload className="h-4 w-4 ml-2" />
            ייבוא מאקסל
          </Button>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש לפי שם, אימייל, טלפון, אוניברסיטה או מדינה..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
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
              <div key={student.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                <StudentRow 
                  student={student} 
                  onEdit={() => setEditingStudent(student)}
                  showActions={true}
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
