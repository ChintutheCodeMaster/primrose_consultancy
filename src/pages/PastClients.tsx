import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { StudentRow } from '@/components/students/StudentRow';
import { mockStudents } from '@/data/mockData';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Student } from '@/types/crm';

export default function PastClients() {
  const { year } = useParams<{ year: string }>();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter students who graduated in the specified year
  const pastClients = mockStudents.filter(student => {
    const graduatedYear = student.status === 'graduated' && 
                          new Date(student.createdAt).getFullYear().toString() === year;
    return graduatedYear;
  });

  const filteredClients = pastClients.filter(student => {
    return student.name.includes(searchTerm) || 
           student.email.includes(searchTerm) || 
           student.phone.includes(searchTerm) ||
           student.targetUniversity.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <MainLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">לקוחות עבר {year}</h1>
            <p className="text-muted-foreground mt-1">סטודנטים שסיימו תהליך בשנת {year} ({filteredClients.length})</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש לפי שם, אימייל, טלפון או אוניברסיטה..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>

        {/* Past Clients List */}
        <div className="space-y-4">
          {filteredClients.map((student, index) => (
            <div key={student.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
              <StudentRow student={student} />
            </div>
          ))}
        </div>

        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">אין לקוחות עבר לשנת {year}</p>
            <p className="text-sm text-muted-foreground mt-2">
              כדי להעביר סטודנט לכאן, שנה את הסטטוס שלו ל"סיים" בעמוד הסטודנטים
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
