import { Student, studentStatusLabels, studentStatusColors } from '@/types/crm';
import { StatusBadge } from '@/components/ui/status-badge';
import { Phone, Mail, GraduationCap, MapPin, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface StudentCardProps {
  student: Student;
  onClick?: () => void;
}

export function StudentCard({ student, onClick }: StudentCardProps) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-2xl bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border border-border/50"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-card-foreground group-hover:text-primary transition-colors">
            {student.name}
          </h3>
          <p className="text-sm text-muted-foreground">{student.program}</p>
        </div>
        <StatusBadge variant={studentStatusColors[student.status]}>
          {studentStatusLabels[student.status]}
        </StatusBadge>
      </div>

      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4" />
          <span dir="ltr">{student.phone}</span>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          <span>{student.email}</span>
        </div>
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4" />
          <span>{student.targetUniversity}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <span>{student.targetCountry}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>תחילת לימודים: {format(student.startDate, 'MM/yyyy', { locale: he })}</span>
        </div>
      </div>

      {student.notes.length > 0 && (
        <div className="mt-4 border-t border-border/50 pt-3">
          <p className="text-xs text-muted-foreground mb-1">הערה אחרונה:</p>
          <p className="text-sm text-muted-foreground">{student.notes[student.notes.length - 1].content}</p>
        </div>
      )}
    </div>
  );
}
