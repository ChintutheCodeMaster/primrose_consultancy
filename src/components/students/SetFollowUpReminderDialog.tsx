import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface SetFollowUpReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  onConfirm: (date: string | null, note: string) => void;
}

export function SetFollowUpReminderDialog({ open, onOpenChange, studentName, onConfirm }: SetFollowUpReminderDialogProps) {
  // Default: 1 month from today
  const defaultDate = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  })();

  const [date, setDate] = useState(defaultDate);
  const [note, setNote] = useState('');

  const handleSave = () => {
    onConfirm(date || null, note.trim());
    setDate(defaultDate);
    setNote('');
    onOpenChange(false);
  };

  const handleSkip = () => {
    onConfirm(null, '');
    setDate(defaultDate);
    setNote('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>הגדרת תזכורת מעקב</DialogTitle>
          <DialogDescription>
            לא הוזנו אוניברסיטאות שהתקבל אליהן עבור <strong>{studentName}</strong>.
            כדאי להגדיר תזכורת לעקוב אחר הסטטוס.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="reminder-date">תאריך תזכורת</Label>
            <Input
              id="reminder-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reminder-note">הערה (אופציונלי)</Label>
            <Textarea
              id="reminder-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="לבדוק האם התקבל לאוניברסיטה..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleSkip}>דלג / בלי תזכורת</Button>
          <Button onClick={handleSave} disabled={!date}>שמור תזכורת</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
