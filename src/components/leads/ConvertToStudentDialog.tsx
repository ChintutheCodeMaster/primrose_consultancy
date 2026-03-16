import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lead, Student } from '@/types/crm';
import { UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { MultiUniversitySelect } from '@/components/ui/multi-university-select';

interface Advisor {
  id: string;
  name: string;
}

interface ConvertToStudentDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConvert: (student: Omit<Student, 'id' | 'createdAt' | 'notes' | 'documents'>) => void;
}

export function ConvertToStudentDialog({ lead, open, onOpenChange, onConvert }: ConvertToStudentDialogProps) {
  const [packageCostText, setPackageCostText] = useState('');
  const [advisorName, setAdvisorName] = useState('');
  const [targetUniversity, setTargetUniversity] = useState('');

  const parseNumber = (text: string): number => {
    const cleaned = text.replace(/[^0-9.,-]/g, '').replace(/,/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  };

  const { data: advisors = [] } = useQuery({
    queryKey: ['advisors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advisors')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data as Advisor[];
    },
  });

  const handleConvert = () => {
    if (!lead) return;

    const student: Omit<Student, 'id' | 'createdAt' | 'notes' | 'documents'> = {
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      status: 'active',
      degreeType: lead.degreeType,
      interestedCountry: lead.interestedCountry,
      interestedField: lead.interestedField,
      source: lead.source,
      meetingSummary: lead.meetingSummary,
      packageNotes: lead.packageNotes,
      packageCost: parseNumber(packageCostText),
      paymentNotes: '',
      advisorName,
      isPaid: false,
      signedAgreement: false,
      acceptedUniversities: [],
      targetCountry: lead.interestedCountry,
      targetUniversity,
      program: `${lead.interestedField} - ${lead.degreeType}`,
      startDate: new Date(),
    };

    onConvert(student);
    onOpenChange(false);
    setPackageCostText('');
    setTargetUniversity('');
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-success" />
            המרה לסטודנט
          </DialogTitle>
          <DialogDescription>
            להמיר את {lead.name} לסטודנט ולהתחיל תהליך ליווי?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm"><strong>שם:</strong> {lead.name}</p>
            <p className="text-sm"><strong>מדינה:</strong> {lead.interestedCountry}</p>
            <p className="text-sm"><strong>תחום:</strong> {lead.interestedField}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetUniversity">אוניברסיטאות יעד (אופציונלי)</Label>
            <MultiUniversitySelect
              value={targetUniversity}
              onChange={setTargetUniversity}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="packageCost">עלות חבילה (₪)</Label>
            <Input
              id="packageCost"
              type="text"
              inputMode="decimal"
              dir="ltr"
              value={packageCostText}
              onChange={(e) => setPackageCostText(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="advisorName">יועץ מלווה</Label>
            <Select value={advisorName} onValueChange={setAdvisorName}>
              <SelectTrigger>
                <SelectValue placeholder="בחר יועץ" />
              </SelectTrigger>
              <SelectContent>
                {advisors.map((advisor) => (
                  <SelectItem key={advisor.id} value={advisor.name}>
                    {advisor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleConvert} className="flex-1 gap-2">
            <UserCheck className="h-4 w-4" />
            המר לסטודנט
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
