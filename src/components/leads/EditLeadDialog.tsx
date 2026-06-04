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
import { FIELD_OPTIONS } from '@/data/fieldOptions';

interface EditLeadDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (lead: Lead) => void;
  includeInactiveAdvisors?: boolean;
}

export function EditLeadDialog({ lead, open, onOpenChange, onSave, includeInactiveAdvisors = false }: EditLeadDialogProps) {
  const sourceOptions = useSourceOptions();
  const { data: leadsCategories = [] } = useCategoriesByType('leads');
  const [formData, setFormData] = useState<Lead | null>(null);
  const [sourceSelection, setSourceSelection] = useState('');
  const [customSource, setCustomSource] = useState('');
  const [fieldSelection, setFieldSelection] = useState('');
  const [customField, setCustomField] = useState('');
  const [initialized, setInitialized] = useState(false);

  // Only initialize form when lead changes or dialog opens, NOT when sourceOptions changes
  useEffect(() => {
    if (lead && open) {
      setFormData({ ...lead });
      setInitialized(false);
    }
  }, [lead, open]);

  // Set source selection once sourceOptions are loaded
  useEffect(() => {
    if (formData && sourceOptions.length > 0 && !initialized) {
      if (formData.source && sourceOptions.includes(formData.source)) {
        setSourceSelection(formData.source);
        setCustomSource('');
      } else if (formData.source) {
        setSourceSelection('Other');
        setCustomSource(formData.source);
      } else {
        setSourceSelection('');
        setCustomSource('');
      }
      // Initialize field selection
      const fieldOptions = FIELD_OPTIONS as readonly string[];
      if (formData.interestedField && fieldOptions.includes(formData.interestedField)) {
        setFieldSelection(formData.interestedField);
        setCustomField('');
      } else if (formData.interestedField) {
        setFieldSelection('Other');
        setCustomField(formData.interestedField);
      } else {
        setFieldSelection('');
        setCustomField('');
      }
      setInitialized(true);
    }
  }, [formData, sourceOptions, initialized]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      const finalSource = sourceSelection === 'Other' ? customSource : sourceSelection;
      const finalField = fieldSelection === 'Other' ? customField : fieldSelection;
      onSave({ ...formData, source: finalSource, interestedField: finalField, lastContactAt: new Date() });
      onOpenChange(false);
    }
  };

  if (!formData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Lead - {formData.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                dir="ltr"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
                type="text"
              dir="ltr"
                value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="leadsYear">Inquiry Year</Label>
              <Select value={formData.leadsYear || ''} onValueChange={(v) => setFormData({ ...formData, leadsYear: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {leadsCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.year_value}>{cat.display_label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="degreeType">Degree Type</Label>
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
              <Label htmlFor="status">Status</Label>
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
              <Label htmlFor="interestedCountry">Desired Countries</Label>
              <MultiCountrySelect
                value={formData.interestedCountry}
                onChange={(v) => setFormData({ ...formData, interestedCountry: v })}
                placeholder="Select countries"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interestedField">Field of Study</Label>
              <Select value={fieldSelection} onValueChange={setFieldSelection}>
                <SelectTrigger>
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {FIELD_OPTIONS.map((field) => (
                    <SelectItem key={field} value={field}>{field}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldSelection === 'Other' && (
                <Input
                  placeholder="Enter other field..."
                  value={customField}
                  onChange={(e) => setCustomField(e.target.value)}
                  className="mt-2"
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Lead Source</Label>
            <Select value={sourceSelection} onValueChange={setSourceSelection}>
              <SelectTrigger>
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {sourceOptions.map((src) => (
                  <SelectItem key={src} value={src}>{src}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {sourceSelection === 'Other' && (
              <Input
                placeholder="Enter other source..."
                value={customSource}
                onChange={(e) => setCustomSource(e.target.value)}
                className="mt-2"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>Consultant</Label>
            <MultiAdvisorSelect
              value={formData.advisorName || ''}
              onChange={(v) => setFormData({ ...formData, advisorName: v })}
              placeholder="Select consultant"
              includeInactive={includeInactiveAdvisors}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meetingSummary">Meeting Summary</Label>
            <Textarea
              id="meetingSummary"
              value={formData.meetingSummary}
              onChange={(e) => setFormData({ ...formData, meetingSummary: e.target.value })}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="packageNotes">Package Notes</Label>
            <Textarea
              id="packageNotes"
              value={formData.packageNotes || ''}
              onChange={(e) => setFormData({ ...formData, packageNotes: e.target.value })}
              rows={2}
              placeholder="Notes about the package..."
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              Save Changes
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}