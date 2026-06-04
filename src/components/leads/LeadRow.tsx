import { Lead, leadStatusLabels, leadStatusColors, degreeTypeLabels } from '@/types/crm';
import { StatusBadge } from '@/components/ui/status-badge';
import { Phone, Mail, MapPin, Calendar, GraduationCap, Briefcase, Share2, Pencil, UserCheck, UserX, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { CopyableContact } from '@/components/ui/copyable-contact';
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

interface LeadRowProps {
  lead: Lead;
  onEdit?: () => void;
  onConvert?: () => void;
  onDidNotContinue?: () => void;
  onDelete?: () => void;
}

export function LeadRow({ lead, onEdit, onConvert, onDidNotContinue, onDelete }: LeadRowProps) {
  return (
    <div className="group rounded-2xl bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-lg border border-border/50">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <span className="text-lg font-bold">{lead.name.charAt(0)}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold text-card-foreground group-hover:text-primary transition-colors">
                {lead.name}
              </h3>
              {lead.isFromWebsite && (
                <span className="inline-flex items-center rounded-full bg-accent text-accent-foreground px-2 py-0.5 text-[10px] font-medium">
                  Auto-generated
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge variant={leadStatusColors[lead.status]}>
                {leadStatusLabels[lead.status]}
              </StatusBadge>
              <span className="text-xs text-muted-foreground">
                {format(lead.createdAt, 'dd/MM/yyyy', { locale: enUS })}
              </span>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap justify-end">
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit} className="gap-1">
              <Pencil className="h-3 w-3" />
              Edit
            </Button>
          )}
          {onDidNotContinue && (
            <Button variant="outline" size="sm" onClick={onDidNotContinue} className="gap-1 text-muted-foreground hover:text-destructive hover:border-destructive">
              <UserX className="h-3 w-3" />
              Closed/Lost
            </Button>
          )}
          {onConvert && (
            <Button variant="default" size="sm" onClick={onConvert} className="gap-1">
              <UserCheck className="h-3 w-3" />
              Convert to Student
            </Button>
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
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will permanently delete the inquiry "{lead.name}" and all related information. This action cannot be undone.
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
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <GraduationCap className="h-4 w-4 shrink-0" />
          <span>{degreeTypeLabels[lead.degreeType]}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground min-w-0">
          <Mail className="h-4 w-4 shrink-0" />
          <CopyableContact value={lead.email} dir="ltr" label="Email" />
        </div>
        <div className="flex items-center gap-2 text-muted-foreground min-w-0">
          <Phone className="h-4 w-4 shrink-0" />
          <CopyableContact value={lead.phone} dir="ltr" label="Phone" />
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4 shrink-0" />
          <span>Created {format(lead.createdAt, 'dd/MM/yyyy', { locale: enUS })}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          <span>{lead.interestedCountry}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Briefcase className="h-4 w-4 shrink-0" />
          <span>{lead.interestedField}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground col-span-2">
          <Share2 className="h-4 w-4 shrink-0" />
          <span>Source: {lead.source}</span>
        </div>
      </div>

      {/* Website Inquiry */}
      {lead.websiteInquiry && (
        <div className="mt-4 border-t border-border/50 pt-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Website Inquiry:</p>
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 border border-blue-200 dark:border-blue-800 space-y-2">
            {lead.websiteInquiry.split('\n').map((line, i) => (
              <p key={i} className="text-sm text-card-foreground">{line}</p>
            ))}
          </div>
        </div>
      )}

      {/* Meeting Summary */}
      {lead.meetingSummary && (
        <div className="mt-4 border-t border-border/50 pt-4">
          <p className="text-xs font-medium text-muted-foreground mb-1">Meeting Summary:</p>
          <p className="text-sm text-card-foreground bg-muted/50 rounded-lg p-3">
            {lead.meetingSummary}
          </p>
        </div>
      )}
    </div>
  );
}
