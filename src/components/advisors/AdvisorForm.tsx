import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { FileText, Upload, X, Eye, EyeOff, Key, Home } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AdvisorFormData {
  name: string;
  email: string;
  phone: string;
  payment_notes: string;
  contract_url: string;
  notes: string;
  is_active: boolean;
  portal_password: string;
}

interface AdvisorFormProps {
  formData: AdvisorFormData;
  onFormDataChange: (data: AdvisorFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isEditing: boolean;
}

export function AdvisorForm({ formData, onFormDataChange, onSubmit, onCancel, isEditing }: AdvisorFormProps) {
  const [uploading, setUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('advisor-contracts')
        .upload(fileName, file, { contentType: file.type, cacheControl: '3600' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('advisor-contracts')
        .getPublicUrl(fileName);

      onFormDataChange({ ...formData, contract_url: publicUrl });
      toast.success('החוזה הועלה בהצלחה');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('שגיאה בהעלאת הקובץ');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">שם היועץ *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="flex items-center justify-between pt-6">
          <Label htmlFor="is_active" className="cursor-pointer">יועץ פעיל</Label>
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => onFormDataChange({ ...formData, is_active: checked })}
          />
        </div>
      </div>

      <div className="p-4 bg-muted/50 rounded-lg space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground">פרטי התקשרות</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">אימייל</Label>
            <Input
              id="email"
              type="email"
              dir="ltr"
              value={formData.email}
              onChange={(e) => onFormDataChange({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">טלפון</Label>
            <Input
              id="phone"
              dir="ltr"
              value={formData.phone}
              onChange={(e) => onFormDataChange({ ...formData, phone: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="p-4 bg-primary/5 rounded-lg space-y-3">
        <h4 className="font-medium text-sm text-muted-foreground">הסכם תשלום</h4>
        <div className="space-y-2">
          <Label htmlFor="payment_notes">פרטי הסכם / הערות תשלום</Label>
          <Textarea
            id="payment_notes"
            value={formData.payment_notes}
            onChange={(e) => onFormDataChange({ ...formData, payment_notes: e.target.value })}
            placeholder="לדוגמה: 500₪ לחבילה + בונוס על קבלות"
            rows={3}
          />
        </div>
      </div>

      <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg space-y-3">
        <h4 className="font-medium text-sm text-muted-foreground">חוזה חתום</h4>
        {formData.contract_url ? (
          <div className="flex items-center gap-2">
            <a
              href={formData.contract_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <FileText className="h-4 w-4" />
              צפה בחוזה
            </a>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onFormDataChange({ ...formData, contract_url: '' })}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              {uploading ? 'מעלה...' : 'העלה חוזה'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
            />
          </div>
        )}
      </div>

      <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg space-y-3">
        <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
          <Key className="h-4 w-4" />
          סיסמה לפורטל היועץ
        </h4>
        <div className="space-y-2">
          <Label htmlFor="portal_password">סיסמה (אופציונלי)</Label>
          <div className="relative">
            <Input
              id="portal_password"
              type={showPassword ? 'text' : 'password'}
              dir="ltr"
              value={formData.portal_password}
              onChange={(e) => onFormDataChange({ ...formData, portal_password: e.target.value })}
              placeholder="השאר ריק לפורטל פתוח"
              className="pl-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            אם תגדיר סיסמה, היועץ יצטרך להזין אותה כדי לגשת לפורטל שלו
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">הערות כלליות</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => onFormDataChange({ ...formData, notes: e.target.value })}
          placeholder="הערות נוספות על היועץ..."
          rows={3}
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">
          {isEditing ? 'שמור' : 'הוסף'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          ביטול
        </Button>
      </div>
    </form>
  );
}
