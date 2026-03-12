import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { Lead, LeadStatus, DegreeType, degreeTypeLabels } from '@/types/crm';
import { useSourceOptions } from '@/hooks/useSourceOptions';
import { useCountryOptions } from '@/hooks/useCountryOptions';
import { useCategoriesByType } from '@/hooks/useSidebarCategories';
import { FIELD_OPTIONS } from '@/data/fieldOptions';

interface AddLeadDialogProps {
  onAdd: (lead: Omit<Lead, 'id' | 'createdAt' | 'lastContactAt'> & { leadsYear: string }) => void;
  defaultYear?: string;
}

export function AddLeadDialog({ onAdd, defaultYear }: AddLeadDialogProps) {
  const sourceOptions = useSourceOptions();
  const countryOptions = useCountryOptions();
  const { data: leadsCategories = [] } = useCategoriesByType('leads');
  const [open, setOpen] = useState(false);
  const [sourceSelection, setSourceSelection] = useState('');
  const [customSource, setCustomSource] = useState('');
  const [fieldSelection, setFieldSelection] = useState('');
  const [customField, setCustomField] = useState('');
  const [selectedYear, setSelectedYear] = useState(defaultYear || '');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    source: '',
    degreeType: 'bachelor' as DegreeType,
    interestedCountry: '',
    interestedField: '',
    meetingSummary: '',
    packageNotes: '',
    status: 'new' as LeadStatus,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSource = sourceSelection === 'אחר' ? customSource : sourceSelection;
    onAdd({ ...formData, source: finalSource, leadsYear: selectedYear || defaultYear || '27' });
    setOpen(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      source: '',
      degreeType: 'bachelor',
      interestedCountry: '',
      interestedField: '',
      meetingSummary: '',
      packageNotes: '',
      status: 'new',
    });
    setSourceSelection('');
    setCustomSource('');
    setSelectedYear(defaultYear || '');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          ליד חדש
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
              
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="leadsYear">שנת מתעניינים</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
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
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source">מקור</Label>
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
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">מדינה</Label>
              <Select value={formData.interestedCountry} onValueChange={(v) => setFormData({ ...formData, interestedCountry: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר מדינה" />
                </SelectTrigger>
                <SelectContent>
                  {countryOptions.map((country) => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="field">תחום לימודים</Label>
              <Input
                id="field"
                value={formData.interestedField}
                onChange={(e) => setFormData({ ...formData, interestedField: e.target.value })}
                placeholder="לדוגמה: פסיכולוגיה"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="meetingSummary">סיכום פגישה</Label>
            <Textarea
              id="meetingSummary"
              value={formData.meetingSummary}
              onChange={(e) => setFormData({ ...formData, meetingSummary: e.target.value })}
              rows={3}
              placeholder="רשום כאן סיכום של השיחה או הפגישה..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="packageNotes">הערות חבילה</Label>
            <Textarea
              id="packageNotes"
              value={formData.packageNotes}
              onChange={(e) => setFormData({ ...formData, packageNotes: e.target.value })}
              rows={2}
              placeholder="הערות לגבי החבילה..."
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
