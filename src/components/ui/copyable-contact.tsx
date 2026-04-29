import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface CopyableContactProps {
  value?: string | null;
  dir?: 'ltr' | 'rtl';
  label?: string;
  className?: string;
}

export function CopyableContact({ value, dir, label, className }: CopyableContactProps) {
  const [copied, setCopied] = useState(false);

  if (!value) {
    return <span className={`truncate text-muted-foreground/60 ${className || ''}`}>—</span>;
  }

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast({
        title: 'הועתק!',
        description: `${label || 'הערך'} הועתק ללוח: ${value}`,
      });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast({
        title: 'שגיאה בהעתקה',
        description: 'לא הצלחנו להעתיק את הערך',
        variant: 'destructive',
      });
    }
  };

  return (
    <span className={`inline-flex items-center gap-1 min-w-0 ${className || ''}`}>
      <button
        type="button"
        onClick={handleCopy}
        dir={dir}
        title="לחץ להעתקה"
        className="truncate text-right hover:text-primary hover:underline cursor-pointer transition-colors"
      >
        {value}
      </button>
      <button
        type="button"
        onClick={handleCopy}
        title="העתק"
        className="shrink-0 p-1 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
      >
        {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
      </button>
    </span>
  );
}
