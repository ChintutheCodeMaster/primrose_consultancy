import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { Student, StudentStatus } from '@/types/crm';

interface AddStudentDialogProps {
  onAdd: (student: Omit<Student, 'id' | 'createdAt' | 'notes' | 'documents'>) => void;
}

export function AddStudentDialog({ onAdd }: AddStudentDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    targetCountry: '',
    targetUniversity: '',
    program: '',
    startDate: new Date(),
    status: 'active' as StudentStatus,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    setOpen(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      targetCountry: '',
      targetUniversity: '',
      program: '',
      startDate: new Date(),
      status: 'active',
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>הוספת סטודנט חדש</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label htmlFor="country">מדינת יעד</Label>
              <Select value={formData.targetCountry} onValueChange={(v) => setFormData({ ...formData, targetCountry: v })}>
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
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="university">אוניברסיטה</Label>
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
          <Button type="submit" className="w-full">
            הוסף סטודנט
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
