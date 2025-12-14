import { Lead, leadStatusLabels, leadStatusColors } from '@/types/crm';
import { StatusBadge } from '@/components/ui/status-badge';
import { Phone, Mail, MapPin, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface LeadCardProps {
  lead: Lead;
  onClick?: () => void;
}

export function LeadCard({ lead, onClick }: LeadCardProps) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-2xl bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border border-border/50"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-card-foreground group-hover:text-primary transition-colors">
            {lead.name}
          </h3>
          <p className="text-sm text-muted-foreground">{lead.source}</p>
        </div>
        <StatusBadge variant={leadStatusColors[lead.status]}>
          {leadStatusLabels[lead.status]}
        </StatusBadge>
      </div>

      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4" />
          <span dir="ltr">{lead.phone}</span>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          <span>{lead.email}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <span>{lead.interestedCountry} - {lead.interestedProgram}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>נוצר {format(lead.createdAt, 'dd/MM/yyyy', { locale: he })}</span>
        </div>
      </div>

      {lead.notes && (
        <p className="mt-4 text-sm text-muted-foreground border-t border-border/50 pt-3">
          {lead.notes}
        </p>
      )}
    </div>
  );
}
