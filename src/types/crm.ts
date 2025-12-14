export type LeadStatus = 'new' | 'contacted' | 'meeting_scheduled' | 'proposal_sent' | 'converted' | 'lost';
export type StudentStatus = 'active' | 'application_phase' | 'accepted' | 'enrolled' | 'graduated' | 'paused';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: LeadStatus;
  interestedCountry: string;
  interestedProgram: string;
  notes: string;
  createdAt: Date;
  lastContactAt: Date;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: StudentStatus;
  targetCountry: string;
  targetUniversity: string;
  program: string;
  startDate: Date;
  notes: Note[];
  documents: Document[];
  createdAt: Date;
}

export interface Note {
  id: string;
  content: string;
  createdAt: Date;
  type: 'call' | 'meeting' | 'email' | 'general';
}

export interface Document {
  id: string;
  name: string;
  type: string;
  uploadedAt: Date;
}

export const leadStatusLabels: Record<LeadStatus, string> = {
  new: 'חדש',
  contacted: 'נוצר קשר',
  meeting_scheduled: 'פגישה נקבעה',
  proposal_sent: 'הצעה נשלחה',
  converted: 'הפך ללקוח',
  lost: 'אבד',
};

export const studentStatusLabels: Record<StudentStatus, string> = {
  active: 'פעיל',
  application_phase: 'בשלב הגשה',
  accepted: 'התקבל',
  enrolled: 'נרשם',
  graduated: 'סיים',
  paused: 'מושהה',
};

export const leadStatusColors: Record<LeadStatus, string> = {
  new: 'bg-accent text-accent-foreground',
  contacted: 'bg-primary/20 text-primary',
  meeting_scheduled: 'bg-warning/20 text-warning-foreground',
  proposal_sent: 'bg-primary/30 text-primary',
  converted: 'bg-success/20 text-success',
  lost: 'bg-destructive/20 text-destructive',
};

export const studentStatusColors: Record<StudentStatus, string> = {
  active: 'bg-success/20 text-success',
  application_phase: 'bg-warning/20 text-warning-foreground',
  accepted: 'bg-accent text-accent-foreground',
  enrolled: 'bg-primary/20 text-primary',
  graduated: 'bg-primary text-primary-foreground',
  paused: 'bg-muted text-muted-foreground',
};
