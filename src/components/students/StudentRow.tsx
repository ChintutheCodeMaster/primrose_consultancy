import { Student, studentStatusLabels, studentStatusColors, degreeTypeLabels } from '@/types/crm';
import { StatusBadge } from '@/components/ui/status-badge';
import { Phone, Mail, MapPin, Calendar, GraduationCap, Briefcase, Share2, User, DollarSign, CheckCircle, XCircle, Building, FileText, Pencil, History, FileSignature, AlertTriangle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface StudentRowProps {
  student: Student;
  onEdit?: () => void;
  onMoveToPastClient?: (year: string) => void;
  showActions?: boolean;
}

const pastClientsYears = ['2026', '2025', '2024', '2023', '2022'];

export function StudentRow({ student, onEdit, onMoveToPastClient, showActions = true }: StudentRowProps) {
  // Check if student needs reminder (not signed agreement and more than 4 days since creation)
  const daysSinceCreation = differenceInDays(new Date(), new Date(student.createdAt));
  const needsAgreementReminder = !student.signedAgreement && daysSinceCreation >= 4;
  const needsPaymentReminder = !student.isPaid && daysSinceCreation >= 7;

  return (
    <div className={`group rounded-2xl bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-lg border ${(needsAgreementReminder || needsPaymentReminder) ? 'border-warning' : 'border-border/50'}`}>
      {/* Agreement Reminder Alert */}
      {needsAgreementReminder && (
        <div className="flex items-center gap-2 bg-warning/10 text-warning-foreground px-4 py-2 rounded-lg mb-4">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <span className="text-sm font-medium">תזכורת: לא חתם על הסכם עבודה ({daysSinceCreation} ימים מתחילת התהליך)</span>
        </div>
      )}

      {/* Payment Reminder Alert */}
      {needsPaymentReminder && (
        <div className="flex items-center gap-2 bg-destructive/10 text-destructive px-4 py-2 rounded-lg mb-4">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span className="text-sm font-medium">תזכורת: לא שילם ({daysSinceCreation} ימים מתחילת התהליך)</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <span className="text-lg font-bold">{student.name.charAt(0)}</span>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-card-foreground group-hover:text-primary transition-colors">
              {student.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge variant={studentStatusColors[student.status]}>
                {studentStatusLabels[student.status]}
              </StatusBadge>
              <span className="text-xs text-muted-foreground">
                {format(student.createdAt, 'dd/MM/yyyy', { locale: he })}
              </span>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Agreement Status Badge */}
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${student.signedAgreement ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning-foreground'}`}>
            {student.signedAgreement ? <FileSignature className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            <span>{student.signedAgreement ? 'חתם הסכם' : 'לא חתם הסכם'}</span>
          </div>
          
          {/* Payment Status Badge */}
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${student.isPaid ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
            {student.isPaid ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            <span>{student.isPaid ? 'שולם' : 'לא שולם'}</span>
          </div>
          
          {showActions && (
            <>
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit} className="gap-1">
                  <Pencil className="h-3 w-3" />
                  עריכה
                </Button>
              )}
              {onMoveToPastClient && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="default" size="sm" className="gap-1">
                      <History className="h-3 w-3" />
                      העבר ללקוח עבר
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {pastClientsYears.map((year) => (
                      <DropdownMenuItem 
                        key={year} 
                        onClick={() => onMoveToPastClient(year)}
                      >
                        לקוחות עבר {year}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          )}
        </div>
      </div>

      {/* Details Grid - Lead Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <GraduationCap className="h-4 w-4 shrink-0" />
          <span>{degreeTypeLabels[student.degreeType]}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="h-4 w-4 shrink-0" />
          <span className="truncate">{student.email}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="h-4 w-4 shrink-0" />
          <span dir="ltr">{student.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4 shrink-0" />
          <span>נוצר {format(student.createdAt, 'dd/MM/yyyy', { locale: he })}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          <span>{student.interestedCountry}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Briefcase className="h-4 w-4 shrink-0" />
          <span>{student.interestedField}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground col-span-2">
          <Share2 className="h-4 w-4 shrink-0" />
          <span>מקור: {student.source}</span>
        </div>
      </div>

      {/* Student-specific Details */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mt-4 pt-4 border-t border-border/50">
        <div className="flex items-center gap-2 text-muted-foreground">
          <DollarSign className="h-4 w-4 shrink-0" />
          <span>עלות חבילה: ₪{student.packageCost.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="h-4 w-4 shrink-0" />
          <span>יועץ: {student.advisorName}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Building className="h-4 w-4 shrink-0" />
          <span>אוניברסיטה יעד: {student.targetUniversity}</span>
        </div>
        {student.paymentNotes && (
          <div className="flex items-center gap-2 text-muted-foreground col-span-full">
            <FileText className="h-4 w-4 shrink-0" />
            <span>הערות תשלום: {student.paymentNotes}</span>
          </div>
        )}
      </div>

      {/* Accepted Universities */}
      {student.acceptedUniversities.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-xs font-medium text-muted-foreground mb-2">אוניברסיטאות שהתקבל אליהן:</p>
          <div className="flex flex-wrap gap-2">
            {student.acceptedUniversities.map((uni, index) => (
              <div key={index} className="flex items-center gap-1 bg-success/10 text-success px-3 py-1 rounded-full text-sm">
                <CheckCircle className="h-3 w-3" />
                <span>{uni.name}</span>
                {uni.acceptanceLetterUrl && (
                  <a 
                    href={uni.acceptanceLetterUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mr-1 hover:text-success/80"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FileText className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meeting Summary */}
      {student.meetingSummary && (
        <div className="mt-4 border-t border-border/50 pt-4">
          <p className="text-xs font-medium text-muted-foreground mb-1">סיכום פגישה:</p>
          <p className="text-sm text-card-foreground bg-muted/50 rounded-lg p-3">
            {student.meetingSummary}
          </p>
        </div>
      )}
    </div>
  );
}
