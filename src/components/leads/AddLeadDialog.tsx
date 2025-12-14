import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { Lead, LeadStatus } from '@/types/crm';

interface AddLeadDialogProps {
  onAdd: (lead: Omit<Lead, 'id' | 'createdAt' | 'lastContactAt'>) => void;
}

export function AddLeadDialog({ onAdd }: AddLeadDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    source: '',
    interestedCountry: '',
    interestedProgram: '',
    notes: '',
    status: 'new' as LeadStatus,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    setOpen(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      source: '',
      interestedCountry: '',
      interestedProgram: '',
      notes: '',
      status: 'new',
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          ליד חדש
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>הוספת ליד חדש</DialogTitle>
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
              <Label htmlFor="source">מקור</Label>
              <Select value={formData.source} onValueChange={(v) => setFormData({ ...formData, source: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר מקור" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="אתר">אתר</SelectItem>
                  <SelectItem value="פייסבוק">פייסבוק</SelectItem>
                  <SelectItem value="אינסטגרם">אינסטגרם</SelectItem>
                  <SelectItem value="גוגל">גוגל</SelectItem>
                  <SelectItem value="המלצה">המלצה</SelectItem>
                  <SelectItem value="אחר">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">מדינה</Label>
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
                  <SelectItem value="אחר">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="program">תוכנית לימודים</Label>
            <Input
              id="program"
              value={formData.interestedProgram}
              onChange={(e) => setFormData({ ...formData, interestedProgram: e.target.value })}
              placeholder="לדוגמה: תואר ראשון בפסיכולוגיה"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">הערות</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>
          <Button type="submit" className="w-full">
            הוסף ליד
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
