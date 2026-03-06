import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export type DiscontinueDestination = 'leads' | 'students';

interface DiscontinueReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string, destination: DiscontinueDestination) => void;
  entityName: string;
  entityType: 'lead' | 'student';
}

export function DiscontinueReasonDialog({ open, onOpenChange, onConfirm, entityName, entityType }: DiscontinueReasonDialogProps) {
  const [reason, setReason] = useState('');
  const [destination, setDestination] = useState<DiscontinueDestination>(entityType === 'lead' ? 'leads' : 'students');

  const handleConfirm = () => {
    onConfirm(reason.trim(), destination);
    setReason('');
    setDestination(entityType === 'lead' ? 'leads' : 'students');
    onOpenChange(false);
  };

  const handleCancel = () => {
    setReason('');
    setDestination(entityType === 'lead' ? 'leads' : 'students');
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
            <Label>לאן לשייך ברשימת "לא המשיכו"?</Label>
            <RadioGroup value={destination} onValueChange={(v) => setDestination(v as DiscontinueDestination)}>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="leads" id="dest-leads" />
                <Label htmlFor="dest-leads" className="cursor-pointer font-normal">מתעניינים</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="students" id="dest-students" />
                <Label htmlFor="dest-students" className="cursor-pointer font-normal">סטודנטים</Label>
              </div>
            </RadioGroup>
          </div>

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
