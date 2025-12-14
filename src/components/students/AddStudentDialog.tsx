import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus } from 'lucide-react';
import { Student, StudentStatus, DegreeType, degreeTypeLabels } from '@/types/crm';

interface AddStudentDialogProps {
  onAdd: (student: Omit<Student, 'id' | 'createdAt' | 'notes' | 'documents'>) => void;
}

export function AddStudentDialog({ onAdd }: AddStudentDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    degreeType: 'bachelor' as DegreeType,
    interestedCountry: '',
    interestedField: '',
    source: '',
    meetingSummary: '',
    packageCost: 0,
    paymentNotes: '',
    advisorName: '',
    isPaid: false,
    signedAgreement: false,
    targetCountry: '',
    targetUniversity: '',
    program: '',
    startDate: new Date(),
    status: 'active' as StudentStatus,
    acceptedUniversities: [] as { name: string; acceptanceLetterUrl?: string }[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    setOpen(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      degreeType: 'bachelor',
      interestedCountry: '',
      interestedField: '',
      source: '',
      meetingSummary: '',
      packageCost: 0,
      paymentNotes: '',
      advisorName: '',
      isPaid: false,
      signedAgreement: false,
      targetCountry: '',
      targetUniversity: '',
      program: '',
      startDate: new Date(),
      status: 'active',
      acceptedUniversities: [],
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          סטודנט חדש
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>הוספת סטודנט חדש</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Personal Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">שם מלא</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">טלפון</Label>
              <Input
                id="phone"
                dir="ltr"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">אימייל</Label>
            <Input
              id="email"
              type="email"
              dir="ltr"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          {/* Lead-like Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="degreeType">סוג תואר</Label>
              <Select value={formData.degreeType} onValueChange={(v: DegreeType) => setFormData({ ...formData, degreeType: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(degreeTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">מקור הגעה</Label>
              <Input
                id="source"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                placeholder="לדוגמה: אתר, המלצה, פייסבוק"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interestedCountry">מדינה מבוקשת</Label>
              <Select value={formData.interestedCountry} onValueChange={(v) => setFormData({ ...formData, interestedCountry: v, targetCountry: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר מדינה" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="אנגליה">אנגליה</SelectItem>
                  <SelectItem value="ארה״ב">ארה״ב</SelectItem>
                  <SelectItem value="קנדה">קנדה</SelectItem>
                  <SelectItem value="הולנד">הולנד</SelectItem>
                  <SelectItem value="גרמניה">גרמניה</SelectItem>
                  <SelectItem value="אוסטרליה">אוסטרליה</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="interestedField">תחום לימודים</Label>
              <Input
                id="interestedField"
                value={formData.interestedField}
                onChange={(e) => setFormData({ ...formData, interestedField: e.target.value })}
                placeholder="לדוגמה: מדעי המחשב, רפואה"
              />
            </div>
          </div>

          {/* Student-specific Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">סטטוס</Label>
              <Select value={formData.status} onValueChange={(v: StudentStatus) => setFormData({ ...formData, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">פעיל</SelectItem>
                  <SelectItem value="application_phase">בשלב הגשה</SelectItem>
                  <SelectItem value="accepted">התקבל</SelectItem>
                  <SelectItem value="enrolled">נרשם</SelectItem>
                  <SelectItem value="graduated">סיים</SelectItem>
                  <SelectItem value="paused">מושהה</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="advisorName">שם היועץ המלווה</Label>
              <Input
                id="advisorName"
                value={formData.advisorName}
                onChange={(e) => setFormData({ ...formData, advisorName: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="packageCost">עלות חבילת הגשה (₪)</Label>
              <Input
                id="packageCost"
                type="number"
                dir="ltr"
                value={formData.packageCost || ''}
                onChange={(e) => setFormData({ ...formData, packageCost: Number(e.target.value) })}
              />
            </div>
            <div className="flex items-center gap-2 pt-8">
              <Checkbox
                id="isPaid"
                checked={formData.isPaid}
                onCheckedChange={(checked) => setFormData({ ...formData, isPaid: checked as boolean })}
              />
              <Label htmlFor="isPaid" className="cursor-pointer">שולם</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentNotes">הערות תשלום</Label>
            <Input
              id="paymentNotes"
              value={formData.paymentNotes}
              onChange={(e) => setFormData({ ...formData, paymentNotes: e.target.value })}
              placeholder="לדוגמה: תשלום 1 מתוך 4, ישלם חצי שני בסוף"
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="signedAgreement"
              checked={formData.signedAgreement}
              onCheckedChange={(checked) => setFormData({ ...formData, signedAgreement: checked as boolean })}
            />
            <Label htmlFor="signedAgreement" className="cursor-pointer">חתם על הסכם עבודה</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="university">אוניברסיטה יעד</Label>
            <Input
              id="university"
              value={formData.targetUniversity}
              onChange={(e) => setFormData({ ...formData, targetUniversity: e.target.value })}
              placeholder="לדוגמה: University of Manchester"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="program">תוכנית לימודים</Label>
            <Input
              id="program"
              value={formData.program}
              onChange={(e) => setFormData({ ...formData, program: e.target.value })}
              placeholder="לדוגמה: תואר ראשון בפסיכולוגיה"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meetingSummary">סיכום פגישה</Label>
            <Textarea
              id="meetingSummary"
              value={formData.meetingSummary}
              onChange={(e) => setFormData({ ...formData, meetingSummary: e.target.value })}
              placeholder="סיכום שיחה או פגישה..."
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full">
            הוסף סטודנט
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
