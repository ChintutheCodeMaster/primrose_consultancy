import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Student, StudentStatus, DegreeType, degreeTypeLabels, studentStatusLabels } from '@/types/crm';

interface EditStudentDialogProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (student: Student) => void;
}

export function EditStudentDialog({ student, open, onOpenChange, onSave }: EditStudentDialogProps) {
  const [formData, setFormData] = useState<Student | null>(null);

  useEffect(() => {
    if (student) {
      setFormData({ ...student });
    }
  }, [student]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      onSave(formData);
      onOpenChange(false);
    }
  };

  if (!formData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>עריכת סטודנט - {formData.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
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
              <Label htmlFor="status">סטטוס</Label>
              <Select value={formData.status} onValueChange={(v: StudentStatus) => setFormData({ ...formData, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(studentStatusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interestedCountry">מדינה מבוקשת</Label>
              <Select value={formData.interestedCountry} onValueChange={(v) => setFormData({ ...formData, interestedCountry: v })}>
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
              />
            </div>
          </div>

          {/* Student-specific fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="advisorName">שם יועץ</Label>
              <Input
                id="advisorName"
                value={formData.advisorName}
                onChange={(e) => setFormData({ ...formData, advisorName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="packageCost">עלות חבילה (₪)</Label>
              <Input
                id="packageCost"
                type="number"
                value={formData.packageCost}
                onChange={(e) => setFormData({ ...formData, packageCost: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentNotes">הערות תשלום</Label>
            <Input
              id="paymentNotes"
              value={formData.paymentNotes || ''}
              onChange={(e) => setFormData({ ...formData, paymentNotes: e.target.value })}
              placeholder="לדוגמה: תשלום 1 מתוך 4, ישלם חצי שני בסוף"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetUniversity">אוניברסיטה יעד</Label>
              <Input
                id="targetUniversity"
                value={formData.targetUniversity}
                onChange={(e) => setFormData({ ...formData, targetUniversity: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="program">תוכנית לימודים</Label>
              <Input
                id="program"
                value={formData.program}
                onChange={(e) => setFormData({ ...formData, program: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">מקור הגעה</Label>
            <Input
              id="source"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            />
          </div>

          {/* Toggles for payment and agreement */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <Label htmlFor="isPaid" className="cursor-pointer">שולם</Label>
              <Switch
                id="isPaid"
                checked={formData.isPaid}
                onCheckedChange={(checked) => setFormData({ ...formData, isPaid: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="signedAgreement" className="cursor-pointer">חתם על הסכם</Label>
              <Switch
                id="signedAgreement"
                checked={formData.signedAgreement}
                onCheckedChange={(checked) => setFormData({ ...formData, signedAgreement: checked })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meetingSummary">סיכום פגישה</Label>
            <Textarea
              id="meetingSummary"
              value={formData.meetingSummary}
              onChange={(e) => setFormData({ ...formData, meetingSummary: e.target.value })}
              rows={4}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              שמור שינויים
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
