export type LeadStatus = 'new' | 'contacted' | 'meeting_scheduled' | 'proposal_sent' | 'converted' | 'lost';
export type StudentStatus = 'active' | 'accepted' | 'enrolled' | 'graduated' | 'paused';
export type DegreeType = 'bachelor' | 'master' | 'phd';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: LeadStatus;
  degreeType: DegreeType;
  interestedCountry: string;
  interestedField: string;
  meetingSummary: string;
  websiteInquiry?: string;
  isFromWebsite?: boolean;
  packageNotes?: string;
  leadsYear?: string;
  advisorName?: string;
  createdAt: Date;
  lastContactAt: Date;
}

export const degreeTypeLabels: Record<DegreeType, string> = {
  bachelor: 'תואר ראשון',
  master: 'תואר שני',
  phd: 'דוקטורט',
};

export interface AcceptedUniversity {
  id?: string;
  name: string;
  country?: string;
  acceptanceLetterUrl?: string;
  degreeType?: string;
  degreeTypeOther?: string;
  field?: string;
  studyYear?: string;
}

export type PaymentType = 'hourly' | 'package' | 'other';

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: StudentStatus;
  degreeType: DegreeType;
  interestedCountry: string;
  interestedField: string;
  source: string;
  meetingSummary: string;
  paymentType?: PaymentType;
  packageCost: number;
  amountPaid?: number;
  paymentNotes: string;
  advisorPaymentNotes?: string;
  packageNotes?: string;
  advisorId?: string;
  advisorName: string;
  isPaid: boolean;
  signedAgreement: boolean;
  acceptedUniversities: AcceptedUniversity[];
  targetCountry: string;
  targetUniversity: string;
  program: string;
  graduationYear?: string;
  startDate?: Date;
  paymentReminderDate?: Date;
  notes: Note[];
  documents?: Document[];
  createdAt: Date;
}

export const paymentTypeLabels: Record<PaymentType, string> = {
  hourly: 'שעתי',
  package: 'חבילה',
  other: 'משולב',
};

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
  accepted: 'bg-accent text-accent-foreground',
  enrolled: 'bg-primary/20 text-primary',
  graduated: 'bg-primary text-primary-foreground',
  paused: 'bg-muted text-muted-foreground',
};
