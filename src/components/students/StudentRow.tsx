import { useState } from 'react';
import { Student, studentStatusLabels, studentStatusColors, degreeTypeLabels } from '@/types/crm';
import { StatusBadge } from '@/components/ui/status-badge';
import { Phone, Mail, MapPin, Calendar, GraduationCap, Briefcase, Share2, User, DollarSign, CheckCircle, XCircle, Building, FileText, Pencil, History, FileSignature, AlertTriangle, Link2, Settings, UserX, Trash2, RotateCcw, Activity, MoreHorizontal } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import { openExternalFile } from '@/lib/file-open';
import { CopyableContact } from '@/components/ui/copyable-contact';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
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
  onRestoreToStudent?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

const pastClientsYears = ['2026', '2025', '2024', '2023', '2022'];

type AgreementType = 'package' | 'hourly' | 'edit' | 'mba';

const agreementTypeLabels: Record<AgreementType, string> = {
  package: 'Package',
  hourly: 'Hourly',
  edit: 'Edit',
  mba: 'MBA',
};

export function StudentRow({ student, onEdit, onMoveToPastClient, onDidNotContinue, onRestoreToStudent, onDelete, showActions = true }: StudentRowProps) {
  const navigate = useNavigate();
  const [showAgreementDetails, setShowAgreementDetails] = useState(false);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [pendingAlumniYear, setPendingAlumniYear] = useState<string | null>(null);
  
  // Check if student needs reminder (not signed agreement and more than 4 days since creation)
  const daysSinceCreation = differenceInDays(new Date(), new Date(student.createdAt));
  const needsAgreementReminder = !student.signedAgreement && daysSinceCreation >= 4;
  
  // Payment reminder: use custom date if set, otherwise fallback to 7 days since creation
  const paymentReminderDate = (student as any).paymentReminderDate;
  const needsPaymentReminder = !student.isPaid && (
    paymentReminderDate 
      ? new Date() >= new Date(paymentReminderDate)
      : daysSinceCreation >= 7
  );

  // Defensive: support both camelCase (app model) and snake_case (DB rows)
  const amountPaid =
    typeof student.amountPaid === 'number'
      ? student.amountPaid
      : Number((student as any).amount_paid ?? 0);

  const copyAgreementLink = (type: AgreementType) => {
    const link = `${window.location.origin}/agreement/${student.id}?type=${type}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied!",
      description: `${agreementTypeLabels[type]} agreement link copied to clipboard`,
    });
  };

  const handleGenerateInviteLink = async () => {
    if (generatingInvite) return;
    setGeneratingInvite(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        sonnerToast.error('Please log in as a consultant to generate an invite.');
        return;
      }

      const { data: advisor, error: advisorErr } = await supabase
        .from('advisors')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (advisorErr || !advisor) {
        sonnerToast.error('Your consultant profile is not linked yet. Contact an admin.');
        return;
      }

      const { data: invite, error: inviteErr } = await supabase
        .from('student_invites')
        .insert({
          advisor_id: advisor.id,
          student_id: student.id,
          email: student.email || null,
          name: student.name || null,
        })
        .select('token')
        .single();

      if (inviteErr || !invite) {
        if ((inviteErr as any)?.code === '23505') {
          sonnerToast.info('An active invite already exists. Open Manage Portal to copy or revoke it.');
          return;
        }
        sonnerToast.error(inviteErr?.message ?? 'Could not generate invite.');
        return;
      }

      const url = `${window.location.origin}/register?invite=${invite.token}`;
      await navigator.clipboard.writeText(url);
      sonnerToast.success('Registration link copied to clipboard.');
    } catch (err) {
      sonnerToast.error(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setGeneratingInvite(false);
    }
  };

  return (
    <div className={`group rounded-2xl bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-lg border ${(needsAgreementReminder || needsPaymentReminder) ? 'border-warning' : 'border-border/50'}`}>
      {/* Agreement Reminder Alert */}
      {needsAgreementReminder && (
        <div className="flex items-center gap-2 bg-warning/10 text-warning-foreground px-4 py-2 rounded-lg mb-4">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <span className="text-sm font-medium">Reminder: Hasn't signed engagement agreement ({daysSinceCreation} days since creation)</span>
        </div>
      )}

      {/* Payment Reminder Alert */}
      {needsPaymentReminder && (
        <div className="flex items-center gap-2 bg-destructive/10 text-destructive px-4 py-2 rounded-lg mb-4">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span className="text-sm font-medium">
            Reminder: Hasn't paid
            {paymentReminderDate 
              ? ` (Reminder for ${format(new Date(paymentReminderDate), 'dd/MM/yyyy', { locale: he })})`
              : ` (${daysSinceCreation} days since creation)`
            }
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            <span className="text-lg font-bold">{student.name.charAt(0)}</span>
          </div>
          <div className="min-w-0">
            <h3 className="text-xl font-semibold text-card-foreground group-hover:text-primary transition-colors truncate">
              {student.name}
            </h3>
            <div className="mt-1">
              <StatusBadge variant={studentStatusColors[student.status]}>
                {studentStatusLabels[student.status]}
              </StatusBadge>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Agreement Status Pill */}
          {student.signedAgreement ? (
            <button
              onClick={() => setShowAgreementDetails(true)}
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-success/15 text-success hover:bg-success/25 transition-colors"
            >
              <FileSignature className="h-3.5 w-3.5" />
              Signed
            </button>
          ) : (
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-warning/15 text-warning-foreground">
              <XCircle className="h-3.5 w-3.5" />
              Unsigned
            </span>
          )}

          {/* Payment Status Pill */}
          <span className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${student.isPaid ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'}`}>
            {student.isPaid ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
            {student.isPaid ? 'Paid' : 'Unpaid'}
          </span>

          {showActions && (
            <>
              {/* Primary action */}
              <Button
                size="sm"
                onClick={() => navigate(`/students/${student.id}/workspace`)}
                className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <Activity className="h-3.5 w-3.5" />
                Workspace
              </Button>

              {/* Overflow menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9" title="More actions">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {onEdit && (
                    <DropdownMenuItem onClick={onEdit}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => navigate(`/student-portal/${student.id}`)}>
                    <Settings className="mr-2 h-4 w-4" />
                    Manage Portal
                  </DropdownMenuItem>

                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Link2 className="mr-2 h-4 w-4" />
                      Copy Agreement Link
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {(Object.keys(agreementTypeLabels) as AgreementType[]).map((t) => (
                          <DropdownMenuItem key={t} onClick={() => copyAgreementLink(t)}>
                            {agreementTypeLabels[t]}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>

                  <DropdownMenuItem onClick={handleGenerateInviteLink} disabled={generatingInvite}>
                    <Link2 className="mr-2 h-4 w-4" />
                    {generatingInvite ? 'Generating…' : 'Copy Invite Link'}
                  </DropdownMenuItem>

                  {(onMoveToPastClient || onRestoreToStudent || onDidNotContinue) && <DropdownMenuSeparator />}

                  {onMoveToPastClient && (
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <History className="mr-2 h-4 w-4" />
                        Move to Alumni
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          {pastClientsYears.map((year) => (
                            <DropdownMenuItem key={year} onSelect={() => setPendingAlumniYear(year)}>
                              Alumni {year}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                  )}

                  {onRestoreToStudent && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Restore to Student
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Restore Alumni to Active Student</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action will restore "{student.name}" to an active student. The graduation year will be deleted and the status will change to active.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={onRestoreToStudent}>
                            Restore to Student
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}

                  {onDidNotContinue && (
                    <DropdownMenuItem onClick={onDidNotContinue} className="text-destructive focus:text-destructive">
                      <UserX className="mr-2 h-4 w-4" />
                      Closed/Lost
                    </DropdownMenuItem>
                  )}

                  {onDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action will permanently delete the student "{student.name}" and all related information. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
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
        <div className="flex items-center gap-2 text-muted-foreground min-w-0">
          <Mail className="h-4 w-4 shrink-0" />
          <CopyableContact value={student.email} dir="ltr" label="Email" />
        </div>
        <div className="flex items-center gap-2 text-muted-foreground min-w-0">
          <Phone className="h-4 w-4 shrink-0" />
          <CopyableContact value={student.phone} dir="ltr" label="Phone" />
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4 shrink-0" />
          <span>Created {format(student.createdAt, 'dd/MM/yyyy', { locale: he })}</span>
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
          <span>Source: {student.source}</span>
        </div>
      </div>

      {/* Student-specific Details */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mt-4 pt-4 border-t border-border/50">
        {/* Payment Type Display */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <DollarSign className="h-4 w-4 shrink-0" />
          <span>
            {student.paymentType === 'hourly' 
              ? 'Hourly Payment' 
              : student.paymentType === 'package' 
                ? `Package Cost: $${student.packageCost.toLocaleString()}`
                : `Blended - Package Cost: $${student.packageCost.toLocaleString()}`
            }
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground font-medium">
          <DollarSign className="h-4 w-4 shrink-0 text-success" />
          <span className="text-success">Amount Paid: ${amountPaid.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="h-4 w-4 shrink-0" />
          <span>Consultant: {student.advisorName}</span>
        </div>
        {student.targetCountry && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            <span className="font-medium">Target Country: {student.targetCountry}</span>
          </div>
        )}
        {student.targetUniversity && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building className="h-4 w-4 shrink-0 text-primary" />
            <span className="font-medium">Target University: {student.targetUniversity}</span>
          </div>
        )}
        {student.program && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <GraduationCap className="h-4 w-4 shrink-0 text-primary" />
            <span className="font-medium">Program: {student.program}</span>
          </div>
        )}
        {student.paymentNotes && (
          <div className="flex items-center gap-2 text-muted-foreground col-span-full">
            <FileText className="h-4 w-4 shrink-0" />
            <span>Payment Notes: {student.paymentNotes}</span>
          </div>
        )}
      </div>

      {/* Applied Universities */}
      {student.appliedUniversities && student.appliedUniversities.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-xs font-medium text-muted-foreground mb-2">Universities Applied To:</p>
          <div className="flex flex-wrap gap-2">
            {student.appliedUniversities.map((uni, index) => {
              const statusLabels: Record<string, string> = {
                submitted: 'Submitted',
                waiting: 'Waiting for response',
                rejected: 'Rejected',
                accepted: 'Accepted',
              };
              const statusLabel = statusLabels[uni.applicationStatus || 'submitted'] || 'Submitted';
              return (
                <div key={index} className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm">
                  <FileText className="h-3 w-3" />
                  <span>{uni.name}</span>
                  {uni.country && <span className="text-primary/70">({uni.country})</span>}
                  {[
                    uni.degreeType === 'Other' ? uni.degreeTypeOther : uni.degreeType,
                    uni.field,
                    uni.studyYear,
                  ].filter(Boolean).length > 0 && (
                    <span className="text-primary/60 text-xs">
                      • {[
                        uni.degreeType === 'Other' ? uni.degreeTypeOther : uni.degreeType,
                        uni.field,
                        uni.studyYear,
                      ].filter(Boolean).join(' • ')}
                    </span>
                  )}
                  <span className="text-primary/60 text-xs">• {statusLabel}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Accepted Universities */}
      {student.acceptedUniversities.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-xs font-medium text-muted-foreground mb-2">Universities Accepted To:</p>
          <div className="flex flex-wrap gap-2">
            {student.acceptedUniversities.map((uni, index) => (
              <div key={index} className="flex flex-col gap-1">
                <div className="flex items-center gap-1 bg-success/10 text-success px-3 py-1.5 rounded-full text-sm">
                  <CheckCircle className="h-3 w-3" />
                  <span>{uni.name}</span>
                  {uni.country && <span className="text-success/70">({uni.country})</span>}
                  {[
                    uni.degreeType === 'Other' ? uni.degreeTypeOther : uni.degreeType,
                    uni.field,
                    uni.studyYear
                  ].filter(Boolean).length > 0 && (
                    <span className="text-success/60 text-xs">
                      • {[
                        uni.degreeType === 'Other' ? uni.degreeTypeOther : uni.degreeType,
                        uni.field,
                        uni.studyYear
                      ].filter(Boolean).join(' • ')}
                    </span>
                  )}
                </div>
                {uni.acceptanceLetterUrl && (
                  <button 
                    type="button"
                    className="flex items-center gap-1 text-xs text-primary hover:underline px-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      openExternalFile(uni.acceptanceLetterUrl!, `acceptance-letter-${uni.name}`);
                    }}
                  >
                    <FileText className="h-3 w-3" />
                    View Acceptance Letter
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Website Inquiry */}
      {student.websiteInquiry && (
        <div className="mt-4 border-t border-border/50 pt-4">
          <p className="text-xs font-medium text-muted-foreground mb-1">Website Inquiry:</p>
          <p className="text-sm text-card-foreground bg-muted/50 rounded-lg p-3 whitespace-pre-wrap">
            {student.websiteInquiry}
          </p>
        </div>
      )}

      {/* Meeting Summary */}
      {student.meetingSummary && (
        <div className="mt-4 border-t border-border/50 pt-4">
          <p className="text-xs font-medium text-muted-foreground mb-1">Meeting Summary:</p>
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

      {/* Move-to-Alumni confirmation — guards against the ⋯ submenu misclick */}
      <AlertDialog
        open={pendingAlumniYear !== null}
        onOpenChange={(open) => { if (!open) setPendingAlumniYear(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move {student.name} to Alumni {pendingAlumniYear}?</AlertDialogTitle>
            <AlertDialogDescription>
              {student.name} will be removed from the active Students list and moved to
              <span className="font-medium"> Alumni {pendingAlumniYear}</span>. You can restore
              them later from the Past Clients page if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingAlumniYear && onMoveToPastClient) {
                  onMoveToPastClient(pendingAlumniYear);
                }
                setPendingAlumniYear(null);
              }}
            >
              Move to Alumni {pendingAlumniYear}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
