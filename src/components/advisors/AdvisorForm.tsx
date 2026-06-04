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
  residence: string;
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
      toast.success('Contract uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Consultant Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="flex items-center justify-between pt-6">
          <Label htmlFor="is_active" className="cursor-pointer">Active Consultant</Label>
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => onFormDataChange({ ...formData, is_active: checked })}
          />
        </div>
      </div>

      <div className="p-4 bg-muted/50 rounded-lg space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground">Contact Details</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              dir="ltr"
              value={formData.email}
              onChange={(e) => onFormDataChange({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              dir="ltr"
              value={formData.phone}
              onChange={(e) => onFormDataChange({ ...formData, phone: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="residence" className="flex items-center gap-1">
            <Home className="h-3.5 w-3.5" />
            Residence
          </Label>
          <Input
            id="residence"
            value={formData.residence}
            onChange={(e) => onFormDataChange({ ...formData, residence: e.target.value })}
            placeholder="e.g., Tel Aviv"
          />
        </div>
      </div>

      <div className="p-4 bg-primary/5 rounded-lg space-y-3">
        <h4 className="font-medium text-sm text-muted-foreground">Payment Agreement</h4>
        <div className="space-y-2">
          <Label htmlFor="payment_notes">Agreement Details / Payment Notes</Label>
          <Textarea
            id="payment_notes"
            value={formData.payment_notes}
            onChange={(e) => onFormDataChange({ ...formData, payment_notes: e.target.value })}
            placeholder="e.g., $500 per package + bonus for acceptance"
            rows={3}
          />
        </div>
      </div>

      <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg space-y-3">
        <h4 className="font-medium text-sm text-muted-foreground">Signed Contract</h4>
        {formData.contract_url ? (
          <div className="flex items-center gap-2">
            <a
              href={formData.contract_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <FileText className="h-4 w-4" />
              View Contract
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
              {uploading ? 'Uploading...' : 'Upload Contract'}
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
          Consultant Portal Password
        </h4>
        <div className="space-y-2">
          <Label htmlFor="portal_password">Password (optional)</Label>
          <div className="relative">
            <Input
              id="portal_password"
              type={showPassword ? 'text' : 'password'}
              dir="ltr"
              value={formData.portal_password}
              onChange={(e) => onFormDataChange({ ...formData, portal_password: e.target.value })}
              placeholder="Leave blank for open portal"
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
            If you set a password, the consultant will need to enter it to access their portal
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">General Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => onFormDataChange({ ...formData, notes: e.target.value })}
          placeholder="Additional notes about the consultant..."
          rows={3}
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">
          {isEditing ? 'Save' : 'Add'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}