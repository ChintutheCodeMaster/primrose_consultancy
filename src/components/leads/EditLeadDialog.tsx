import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { MultiCountrySelect } from '@/components/ui/multi-country-select';
import { MultiAdvisorSelect } from '@/components/ui/multi-advisor-select';
import { Lead, LeadStatus, DegreeType, degreeTypeLabels, leadStatusLabels } from '@/types/crm';
import { useCategoriesByType } from '@/hooks/useSidebarCategories';
import { useSourceOptions } from '@/hooks/useSourceOptions';
import { supabase } from '@/integrations/supabase/client';

interface EditLeadDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (lead: Lead) => void;
}

export function EditLeadDialog({ lead, open, onOpenChange, onSave }: EditLeadDialogProps) {
  const sourceOptions = useSourceOptions();
  const { data: leadsCategories = [] } = useCategoriesByType('leads');
  const [formData, setFormData] = useState<Lead | null>(null);
  const [sourceSelection, setSourceSelection] = useState('');
  const [customSource, setCustomSource] = useState('');

  useEffect(() => {
    if (lead) {
      setFormData({ ...lead });
      // Check if the source is a predefined option or custom
      if (lead.source && sourceOptions.includes(lead.source)) {
        setSourceSelection(lead.source);
        setCustomSource('');
      } else if (lead.source) {
        setSourceSelection('אחר');
        setCustomSource(lead.source);
      } else {
        setSourceSelection('');
        setCustomSource('');
      }
    }
  }, [lead, sourceOptions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      const finalSource = sourceSelection === 'אחר' ? customSource : sourceSelection;
      onSave({ ...formData, source: finalSource, lastContactAt: new Date() });
      onOpenChange(false);
    }
  };

  if (!formData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>עריכת ליד - {formData.name}</DialogTitle>
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

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="leadsYear">שנת מתעניינים</Label>
              <Select value={formData.leadsYear || ''} onValueChange={(v) => setFormData({ ...formData, leadsYear: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר שנה" />
                </SelectTrigger>
                <SelectContent>
                  {leadsCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.year_value}>{cat.display_label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              <Select value={formData.status} onValueChange={(v: LeadStatus) => setFormData({ ...formData, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(leadStatusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interestedCountry">מדינות מבוקשות</Label>
              <MultiCountrySelect
                value={formData.interestedCountry}
                onChange={(v) => setFormData({ ...formData, interestedCountry: v })}
                placeholder="בחר מדינות"
              />
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

          <div className="space-y-2">
            <Label htmlFor="source">מקור הגעה</Label>
            <Select value={sourceSelection} onValueChange={setSourceSelection}>
              <SelectTrigger>
                <SelectValue placeholder="בחר מקור" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {sourceOptions.map((src) => (
                  <SelectItem key={src} value={src}>{src}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {sourceSelection === 'אחר' && (
              <Input
                placeholder="הזן מקור אחר..."
                value={customSource}
                onChange={(e) => setCustomSource(e.target.value)}
                className="mt-2"
              />
            )}
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

          <div className="space-y-2">
            <Label htmlFor="packageNotes">הערות חבילה</Label>
            <Textarea
              id="packageNotes"
              value={formData.packageNotes || ''}
              onChange={(e) => setFormData({ ...formData, packageNotes: e.target.value })}
              rows={2}
              placeholder="הערות לגבי החבילה..."
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
