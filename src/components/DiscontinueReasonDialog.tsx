import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface DiscontinueReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  entityName: string;
  entityType: 'lead' | 'student';
}

export function DiscontinueReasonDialog({ open, onOpenChange, onConfirm, entityName, entityType }: DiscontinueReasonDialogProps) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(reason.trim());
    setReason('');
    onOpenChange(false);
  };

  const handleCancel = () => {
    setReason('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>העברה ל&quot;לא המשיכו&quot;</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            {entityType === 'lead' ? 'המתעניין' : 'הסטודנט'} <strong>{entityName}</strong> יועבר לרשימת "לא המשיכו".
          </p>
          <div className="space-y-2">
            <Label htmlFor="reason">למה לא המשיך/ה? (אופציונלי)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="פרט/י את הסיבה..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>ביטול</Button>
          <Button onClick={handleConfirm}>העבר ל&quot;לא המשיכו&quot;</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
