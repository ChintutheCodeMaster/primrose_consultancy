import { useState } from 'react';
import { Student, studentStatusLabels, studentStatusColors, degreeTypeLabels } from '@/types/crm';
import { StatusBadge } from '@/components/ui/status-badge';
import { Phone, Mail, MapPin, Calendar, GraduationCap, Briefcase, Share2, User, DollarSign, CheckCircle, XCircle, Building, FileText, Pencil, History, FileSignature, AlertTriangle, Link2, ExternalLink, Settings, UserX, Trash2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { AgreementDetailsDialog } from './AgreementDetailsDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface StudentRowProps {
  student: Student;
  onEdit?: () => void;
  onMoveToPastClient?: (year: string) => void;
  onDidNotContinue?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

const pastClientsYears = ['2026', '2025', '2024', '2023', '2022'];

type AgreementType = 'package' | 'hourly' | 'edit';

const agreementTypeLabels: Record<AgreementType, string> = {
  package: 'חבילה',
  hourly: 'שעתי',
  edit: 'לערוך',
};

export function StudentRow({ student, onEdit, onMoveToPastClient, onDidNotContinue, onDelete, showActions = true }: StudentRowProps) {
  const navigate = useNavigate();
  const [agreementType, setAgreementType] = useState<AgreementType>('package');
  const [showAgreementDetails, setShowAgreementDetails] = useState(false);
  
  // Check if student needs reminder (not signed agreement and more than 4 days since creation)
  const daysSinceCreation = differenceInDays(new Date(), new Date(student.createdAt));
  const needsAgreementReminder = !student.signedAgreement && daysSinceCreation >= 4;
  const needsPaymentReminder = !student.isPaid && daysSinceCreation >= 7;

  // Defensive: support both camelCase (app model) and snake_case (DB rows)
  const amountPaid =
    typeof student.amountPaid === 'number'
      ? student.amountPaid
      : Number((student as any).amount_paid ?? 0);

  const copyAgreementLink = () => {
    const link = `${window.location.origin}/agreement/${student.id}?type=${agreementType}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "הקישור הועתק!",
      description: `קישור להסכם ${agreementTypeLabels[agreementType]} הועתק ללוח`,
    });
  };

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
          {/* Agreement Status Badge - Clickable if signed */}
          {student.signedAgreement ? (
            <button
              onClick={() => setShowAgreementDetails(true)}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-success/20 text-success hover:bg-success/30 transition-colors cursor-pointer"
            >
              <FileSignature className="h-4 w-4" />
              <span>חתם הסכם</span>
            </button>
          ) : (
            <div className="flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-warning/20 text-warning-foreground">
              <XCircle className="h-4 w-4" />
              <span>לא חתם הסכם</span>
            </div>
          )}
          
          {/* Payment Status Badge */}
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${student.isPaid ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
            {student.isPaid ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            <span>{student.isPaid ? 'שולם' : 'לא שולם'}</span>
          </div>
          
          {showActions && (
            <>
              {/* Portal Management Button */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate(`/student-portal/${student.id}`)}
                className="gap-1"
                title="ניהול פורטל מועמד"
              >
                <Settings className="h-3 w-3" />
                ניהול פורטל
              </Button>

              {/* Agreement Type Select + Copy Link */}
              <div className="flex items-center gap-1">
                <Select value={agreementType} onValueChange={(v) => setAgreementType(v as AgreementType)}>
                  <SelectTrigger className="h-8 w-24 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="package">חבילה</SelectItem>
                    <SelectItem value="hourly">שעתי</SelectItem>
                    <SelectItem value="edit">לערוך</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={copyAgreementLink}
                  className="gap-1"
                  title="העתק קישור להסכם"
                >
                  <Link2 className="h-3 w-3" />
                  קישור להסכם
                </Button>
              </div>

              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit} className="gap-1">
                  <Pencil className="h-3 w-3" />
                  עריכה
                </Button>
              )}
              {onDidNotContinue && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onDidNotContinue} 
                  className="gap-1 text-muted-foreground hover:text-destructive hover:border-destructive"
                >
                  <UserX className="h-3 w-3" />
                  לא המשיך
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
              {onDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-3 w-3" />
                      מחיקה
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
                      <AlertDialogDescription>
                        פעולה זו תמחק לצמיתות את הסטודנט "{student.name}" ואת כל המידע הקשור אליו. לא ניתן לבטל פעולה זו.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>ביטול</AlertDialogCancel>
                      <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        מחק
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
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
        <div className="flex items-center gap-2 text-muted-foreground font-medium">
          <DollarSign className="h-4 w-4 shrink-0 text-success" />
          <span className="text-success">שולם בפועל: ₪{amountPaid.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="h-4 w-4 shrink-0" />
          <span>יועץ: {student.advisorName}</span>
        </div>
        {student.targetCountry && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            <span className="font-medium">מדינה נבחרת: {student.targetCountry}</span>
          </div>
        )}
        {student.targetUniversity && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building className="h-4 w-4 shrink-0 text-primary" />
            <span className="font-medium">אוניברסיטה נבחרת: {student.targetUniversity}</span>
          </div>
        )}
        {student.program && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <GraduationCap className="h-4 w-4 shrink-0 text-primary" />
            <span className="font-medium">תוכנית: {student.program}</span>
          </div>
        )}
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

      {/* Agreement Details Dialog */}
      <AgreementDetailsDialog
        studentId={student.id}
        studentName={student.name}
        open={showAgreementDetails}
        onOpenChange={setShowAgreementDetails}
      />
    </div>
  );
}
