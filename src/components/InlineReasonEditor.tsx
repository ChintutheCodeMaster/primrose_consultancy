import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquarePlus, Check, X } from 'lucide-react';

interface InlineReasonEditorProps {
  reason: string | null;
  onSave: (reason: string) => void;
}

export function InlineReasonEditor({ reason, onSave }: InlineReasonEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(reason || '');

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSave(value.trim());
    setIsEditing(false);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setValue(reason || '');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="mt-2" onClick={(e) => e.stopPropagation()}>
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="למה לא המשיך/ה?"
          rows={2}
          className="text-sm mb-2"
          autoFocus
        />
        <div className="flex gap-2">
          <Button size="sm" variant="default" onClick={handleSave} className="gap-1 h-7 text-xs">
            <Check className="h-3 w-3" />
            שמור
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel} className="gap-1 h-7 text-xs">
            <X className="h-3 w-3" />
            ביטול
          </Button>
        </div>
      </div>
    );
  }

  if (reason) {
    return (
      <div
        className="mt-2 text-sm text-muted-foreground bg-muted/50 rounded px-3 py-1.5 cursor-pointer hover:bg-muted/80 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
        title="לחצ/י לעריכה"
      >
        <strong>למה לא המשיכו:</strong> {reason}
      </div>
    );
  }

  return (
    <button
      className="mt-2 text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
    >
      <MessageSquarePlus className="h-3 w-3" />
      הוסף סיבה
    </button>
  );
}
