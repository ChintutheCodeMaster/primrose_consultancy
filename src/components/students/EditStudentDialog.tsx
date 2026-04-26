import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { MultiCountrySelect } from '@/components/ui/multi-country-select';
import { MultiAdvisorSelect } from '@/components/ui/multi-advisor-select';
import { UniversityDropdown } from '@/components/ui/university-dropdown';
import { CountryDropdown } from '@/components/ui/country-dropdown';
import { MultiUniversitySelect } from '@/components/ui/multi-university-select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Student, StudentStatus, DegreeType, degreeTypeLabels, studentStatusLabels, AcceptedUniversity } from '@/types/crm';
import { Plus, Trash2, Upload, FileText, X, MessageSquare, Calendar, CalendarIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSourceOptions } from '@/hooks/useSourceOptions';
import { useCountryOptions } from '@/hooks/useCountryOptions';
import { openExternalFile } from '@/lib/file-open';
import { cn } from '@/lib/utils';
import { FIELD_OPTIONS } from '@/data/fieldOptions';
import { FieldAutocomplete } from '@/components/ui/field-autocomplete';

interface Advisor {
  id: string;
  name: string;
}

interface Conversation {
  id: string;
  conversation_date: string;
  summary: string;
  follow_up_actions: string | null;
  created_by: string;
  advisor_name?: string;
}

interface EditStudentDialogProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (student: Student) => void;
}

export function EditStudentDialog({ student, open, onOpenChange, onSave }: EditStudentDialogProps) {
  const sourceOptions = useSourceOptions();
  const countryOptions = useCountryOptions();
  const [formData, setFormData] = useState<Student | null>(null);
  const [sourceSelection, setSourceSelection] = useState('');
  const [customSource, setCustomSource] = useState('');
  const [fieldSelection, setFieldSelection] = useState('');
  const [customField, setCustomField] = useState('');
  const [packageCostText, setPackageCostText] = useState('');
  const [amountPaidText, setAmountPaidText] = useState('');
  const [newUniversityName, setNewUniversityName] = useState('');
  const [newUniversityCountry, setNewUniversityCountry] = useState('');
  const [newUniversityDegreeType, setNewUniversityDegreeType] = useState('');
  const [newUniversityDegreeTypeOther, setNewUniversityDegreeTypeOther] = useState('');
  const [newUniversityField, setNewUniversityField] = useState('');
  const [newUniversityStudyYear, setNewUniversityStudyYear] = useState('');
  const [uploadingFor, setUploadingFor] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);

  // Applied universities (universities the student has applied to)
  type AppliedUniversity = {
    id?: string;
    name: string;
    country?: string;
    degreeType?: string;
    degreeTypeOther?: string;
    field?: string;
    studyYear?: string;
    applicationStatus?: string;
    notes?: string;
  };
  const [appliedUniversities, setAppliedUniversities] = useState<AppliedUniversity[]>([]);
  const [newAppliedName, setNewAppliedName] = useState('');
  const [newAppliedCountry, setNewAppliedCountry] = useState('');
  const [newAppliedDegreeType, setNewAppliedDegreeType] = useState('');
  const [newAppliedDegreeTypeOther, setNewAppliedDegreeTypeOther] = useState('');
  const [newAppliedField, setNewAppliedField] = useState('');
  const [newAppliedStudyYear, setNewAppliedStudyYear] = useState('');
  const [newAppliedStatus, setNewAppliedStatus] = useState('submitted');
  const [newAppliedNotes, setNewAppliedNotes] = useState('');

  const applicationStatusLabels: Record<string, string> = {
    submitted: 'הוגש',
    waiting: 'ממתין לתשובה',
    rejected: 'נדחה',
    accepted: 'התקבל',
  };

  const { data: advisors = [] } = useQuery({
    queryKey: ['advisors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advisors')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data as Advisor[];
    },
  });

  // Fetch conversations when student changes
  useEffect(() => {
    if (student && open) {
      fetchConversations(student.id);
      fetchAppliedUniversities(student.id);
    }
  }, [student, open]);

  const parseCurrencyInput = (raw: string) => {
    // Allow pasting values like "1,180", "₪1180", "1180.50"
    const cleaned = raw
      .replace(/[^0-9.,-]/g, '')
      .replace(/,/g, '');

    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  };

  const fetchConversations = async (studentId: string) => {
    setLoadingConversations(true);
    const { data } = await supabase
      .from('student_conversations')
      .select(`
        id,
        conversation_date,
        summary,
        follow_up_actions,
        created_by,
        advisors (name)
      `)
      .eq('student_id', studentId)
      .order('conversation_date', { ascending: false });
    
    if (data) {
      setConversations(data.map((c: any) => ({
        ...c,
        advisor_name: c.advisors?.name || null
      })));
    }
    setLoadingConversations(false);
  };

  const fetchAppliedUniversities = async (studentId: string) => {
    const { data } = await (supabase as any)
      .from('applied_universities')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });
    if (data) {
      setAppliedUniversities(data.map((u: any) => ({
        id: u.id,
        name: u.name,
        country: u.country || '',
        degreeType: u.degree_type || '',
        degreeTypeOther: u.degree_type_other || '',
        field: u.field || '',
        studyYear: u.study_year || '',
        applicationStatus: u.application_status || 'submitted',
        notes: u.notes || '',
      })));
    } else {
      setAppliedUniversities([]);
    }
  };

  // Initialize form data ONLY when the student changes.
  // (Previously this also depended on sourceOptions, which changes reference and caused the form to reset on every keystroke.)
  useEffect(() => {
    if (!student) return;

    // Normalize amountPaid because some callers may still provide snake_case (amount_paid)
    const rawAmountPaid = (student as any).amountPaid ?? (student as any).amount_paid ?? 0;
    const normalizedAmountPaid = Number(rawAmountPaid);

    setFormData({
      ...(student as any),
      acceptedUniversities: Array.isArray((student as any).acceptedUniversities) ? (student as any).acceptedUniversities : [],
      amountPaid: Number.isFinite(normalizedAmountPaid) ? normalizedAmountPaid : 0,
    });
    
    // Initialize text fields for decimal input
    setPackageCostText(String((student as any).packageCost || ''));
    setAmountPaidText(String(Number.isFinite(normalizedAmountPaid) ? normalizedAmountPaid : ''));
  }, [student]);

  // Sync source selection only once when student changes (not on sourceOptions reference changes)
  const sourceOptionsRef = useRef(sourceOptions);
  sourceOptionsRef.current = sourceOptions;
  
  useEffect(() => {
    if (!student) return;
    const currentSource = student.source || '';
    const opts = sourceOptionsRef.current;
    if (opts.includes(currentSource)) {
      setSourceSelection(currentSource);
      setCustomSource('');
    } else if (currentSource) {
      setSourceSelection('אחר');
      setCustomSource(currentSource);
    } else {
      setSourceSelection('');
      setCustomSource('');
    }
    // Initialize field selection
    const currentField = student.interestedField || '';
    setFieldSelection(currentField);
    setCustomField('');
  }, [student]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      // Parse numeric values from text fields
      const finalField = fieldSelection;
      const finalFormData = {
        ...formData,
        interestedField: finalField,
        packageCost: parseCurrencyInput(packageCostText),
        amountPaid: parseCurrencyInput(amountPaidText),
      };
      
      // Save accepted universities to database
      if (student) {
        console.log('Saving universities for student:', student.id, 'Universities:', finalFormData.acceptedUniversities);
        
        // Delete existing universities for this student
        const { error: deleteError } = await supabase
          .from('accepted_universities')
          .delete()
          .eq('student_id', student.id);
        
        if (deleteError) {
          console.error('Error deleting old universities:', deleteError);
        }

        // Insert new universities
        if (finalFormData.acceptedUniversities.length > 0) {
          const { error } = await supabase
            .from('accepted_universities')
            .insert(
              finalFormData.acceptedUniversities.map(uni => ({
                student_id: student.id,
                name: uni.name,
                country: uni.country || null,
                acceptance_letter_url: uni.acceptanceLetterUrl || null,
                degree_type: uni.degreeType || null,
                degree_type_other: uni.degreeTypeOther || null,
                field: uni.field || null,
                study_year: uni.studyYear || null,
              }))
            );
          
          if (error) {
            console.error('Error saving universities:', error);
            toast.error('שגיאה בשמירת האוניברסיטאות');
          } else {
            console.log('Universities saved successfully');
          }
        }

        // Save applied universities (replace strategy)
        const { error: deleteAppliedErr } = await (supabase as any)
          .from('applied_universities')
          .delete()
          .eq('student_id', student.id);
        if (deleteAppliedErr) console.error('Error deleting old applied universities:', deleteAppliedErr);

        if (appliedUniversities.length > 0) {
          const { error: insertAppliedErr } = await (supabase as any)
            .from('applied_universities')
            .insert(
              appliedUniversities.map(uni => ({
                student_id: student.id,
                name: uni.name,
                country: uni.country || null,
                degree_type: uni.degreeType || null,
                degree_type_other: uni.degreeTypeOther || null,
                field: uni.field || null,
                study_year: uni.studyYear || null,
                application_status: uni.applicationStatus || 'submitted',
                notes: uni.notes || null,
              }))
            );
          if (insertAppliedErr) {
            console.error('Error saving applied universities:', insertAppliedErr);
            toast.error('שגיאה בשמירת האוניברסיטאות שהוגשו');
          }
        }
      }

      onSave(finalFormData);
      onOpenChange(false);
    }
  };


  const handleAddUniversity = () => {
    if (newUniversityName.trim() && newUniversityCountry.trim() && formData) {
      setFormData({
        ...formData,
        acceptedUniversities: [
          ...formData.acceptedUniversities,
          { 
            name: newUniversityName.trim(), 
            country: newUniversityCountry.trim(),
            degreeType: newUniversityDegreeType || undefined,
            degreeTypeOther: newUniversityDegreeType === 'אחר' ? newUniversityDegreeTypeOther : undefined,
            field: newUniversityField || undefined,
            studyYear: newUniversityStudyYear || undefined,
          }
        ]
      });
      setNewUniversityName('');
      setNewUniversityCountry('');
      setNewUniversityDegreeType('');
      setNewUniversityDegreeTypeOther('');
      setNewUniversityField('');
      setNewUniversityStudyYear('');
    }
  };

  const handleRemoveUniversity = (index: number) => {
    if (formData) {
      setFormData({
        ...formData,
        acceptedUniversities: formData.acceptedUniversities.filter((_, i) => i !== index)
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = event.target.files?.[0];
    if (!file || !formData || !student) return;

    setUploadingFor(index);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${student.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('acceptance-letters')
        .upload(fileName, file, { contentType: file.type, cacheControl: '3600' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('acceptance-letters')
        .getPublicUrl(fileName);

      const updatedUniversities = [...formData.acceptedUniversities];
      updatedUniversities[index] = {
        ...updatedUniversities[index],
        acceptanceLetterUrl: publicUrl
      };

      setFormData({
        ...formData,
        acceptedUniversities: updatedUniversities
      });

      toast.success('הקובץ הועלה בהצלחה');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('שגיאה בהעלאת הקובץ');
    } finally {
      setUploadingFor(null);
    }
  };

  const handleRemoveFile = (index: number) => {
    if (formData) {
      const updatedUniversities = [...formData.acceptedUniversities];
      updatedUniversities[index] = {
        ...updatedUniversities[index],
        acceptanceLetterUrl: undefined
      };
      setFormData({
        ...formData,
        acceptedUniversities: updatedUniversities
      });
    }
  };

  if (!formData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>עריכת סטודנט - {formData.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
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
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">אימייל</Label>
            <Input
              id="email"
              type="text"
              dir="ltr"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={!formData.email ? 'border-orange-300' : ''}
            />
            {!formData.email && (
              <p className="text-xs text-orange-600">⚠️ לא הוזנה כתובת אימייל</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              <Select value={formData.status} onValueChange={(v: StudentStatus) => setFormData({ ...formData, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(studentStatusLabels).map(([value, label]) => (
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
              <FieldAutocomplete
                value={fieldSelection}
                onChange={(v) => setFieldSelection(v)}
                placeholder="בחר תחום"
              />
            </div>
          </div>

          {/* Student-specific fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="advisorName">יועצים</Label>
              <MultiAdvisorSelect
                value={formData.advisorName || ''}
                onChange={(v) => setFormData({ ...formData, advisorName: v })}
                placeholder="בחר יועצים"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentType">סוג תשלום</Label>
              <Select 
                value={(formData as any).paymentType || 'package'} 
                onValueChange={(v: 'hourly' | 'package' | 'other') => setFormData({ ...formData, paymentType: v } as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="hourly">שעתי</SelectItem>
                  <SelectItem value="package">חבילה</SelectItem>
                  <SelectItem value="other">משולב</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="packageCost">עלות חבילה (₪)</Label>
            <Input
              id="packageCost"
              type="text"
              inputMode="decimal"
              dir="ltr"
              value={packageCostText}
              onChange={(e) => setPackageCostText(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amountPaid">שולם בפועל (₪)</Label>
              <Input
                id="amountPaid"
                type="text"
                inputMode="decimal"
                dir="ltr"
                value={amountPaidText}
                onChange={(e) => setAmountPaidText(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">יתרה לתשלום</Label>
              <div className="h-10 px-3 flex items-center rounded-md border bg-muted/50 text-muted-foreground">
                ₪{(parseCurrencyInput(packageCostText) - parseCurrencyInput(amountPaidText)).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentNotes">הערות תשלום</Label>
            <Input
              id="paymentNotes"
              value={formData.paymentNotes || ''}
              onChange={(e) => setFormData({ ...formData, paymentNotes: e.target.value })}
              placeholder="לדוגמה: תשלום 1 מתוך 4, ישלם חצי שני בסוף"
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

          {(formData.paymentType === 'package' || formData.paymentType === 'other') && (
            <div className="space-y-2">
              <Label htmlFor="advisorPaymentNotes">תשלום ליועץ</Label>
              <Textarea
                id="advisorPaymentNotes"
                value={formData.advisorPaymentNotes || ''}
                onChange={(e) => setFormData({ ...formData, advisorPaymentNotes: e.target.value })}
                rows={2}
                placeholder="פרטים על תשלום ליועץ (יוצג בפורטל היועצים כ'תשלום סטודנט')..."
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetCountry">מדינה נבחרת</Label>
              <Select value={formData.targetCountry || ''} onValueChange={(v) => setFormData({ ...formData, targetCountry: v })}>
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
              <Label htmlFor="targetUniversity">אוניברסיטאות יעד</Label>
              <MultiUniversitySelect
                value={formData.targetUniversity}
                onChange={(v) => setFormData({ ...formData, targetUniversity: v })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="program">תוכנית לימודים</Label>
            <Input
              id="program"
              value={formData.program}
              onChange={(e) => setFormData({ ...formData, program: e.target.value })}
            />
          </div>

          {/* Accepted Universities Section */}
          <div className="space-y-3 p-4 bg-success/5 rounded-lg border border-success/20">
            <Label className="text-base font-semibold">אוניברסיטאות שהתקבל אליהן</Label>
            
            {/* Add new university */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <CountryDropdown
                  value={newUniversityCountry}
                  onChange={setNewUniversityCountry}
                  placeholder="בחר מדינה *"
                  className={!newUniversityCountry && newUniversityName.trim() ? '[&>button]:border-orange-300 [&>button]:bg-orange-50' : ''}
                />
                <UniversityDropdown
                  value={newUniversityName}
                  onChange={setNewUniversityName}
                  placeholder="שם האוניברסיטה *"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Select value={newUniversityDegreeType} onValueChange={setNewUniversityDegreeType}>
                  <SelectTrigger>
                    <SelectValue placeholder="סוג תואר" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="תואר ראשון">תואר ראשון</SelectItem>
                    <SelectItem value="תואר שני">תואר שני</SelectItem>
                    <SelectItem value="דוקטורט">דוקטורט</SelectItem>
                    <SelectItem value="אחר">אחר</SelectItem>
                  </SelectContent>
                </Select>
                <FieldAutocomplete
                  value={newUniversityField}
                  onChange={setNewUniversityField}
                  placeholder="תחום לימודים"
                />
                <Input
                  value={newUniversityStudyYear}
                  onChange={(e) => setNewUniversityStudyYear(e.target.value)}
                  placeholder="שנת לימודים"
                />
              </div>
              {newUniversityDegreeType === 'אחר' && (
                <Input
                  value={newUniversityDegreeTypeOther}
                  onChange={(e) => setNewUniversityDegreeTypeOther(e.target.value)}
                  placeholder="סוג תואר אחר..."
                />
              )}
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleAddUniversity} 
                disabled={!newUniversityCountry || !newUniversityName.trim()}
                className="w-full"
              >
                <Plus className="h-4 w-4 ml-2" />
                הוסף אוניברסיטה
              </Button>
              {!newUniversityCountry && newUniversityName.trim() && (
                <p className="text-xs text-orange-600">יש לבחור מדינה כדי להוסיף</p>
              )}
            </div>

            {/* List of accepted universities - grouped by country */}
            {formData.acceptedUniversities.length > 0 && (
              <div className="space-y-3">
                {Object.entries(
                  formData.acceptedUniversities.reduce((acc, uni, index) => {
                    const country = uni.country || 'ללא מדינה';
                    if (!acc[country]) acc[country] = [];
                    acc[country].push({ ...uni, originalIndex: index });
                    return acc;
                  }, {} as Record<string, (AcceptedUniversity & { originalIndex: number })[]>)
                ).map(([country, universities]) => (
                  <div key={country} className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground px-1">{country}</div>
                    <div className="space-y-1">
                      {universities.map((uni) => (
                        <div key={uni.originalIndex} className="flex items-center gap-2 p-2.5 bg-background rounded-lg border">
                          <div className="flex-1">
                            <span className="font-medium">{uni.name}</span>
                            {[
                              uni.degreeType === 'אחר' ? uni.degreeTypeOther : uni.degreeType,
                              uni.field,
                              uni.studyYear
                            ].filter(Boolean).length > 0 && (
                              <span className="text-xs text-muted-foreground mr-2">
                                {[
                                  uni.degreeType === 'אחר' ? uni.degreeTypeOther : uni.degreeType,
                                  uni.field,
                                  uni.studyYear
                                ].filter(Boolean).join(' • ')}
                              </span>
                            )}
                          </div>
                          
                          {uni.acceptanceLetterUrl ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                className="flex items-center gap-1 text-sm text-primary hover:underline"
                                onClick={() => openExternalFile(uni.acceptanceLetterUrl!, `acceptance-letter-${uni.name}`)}
                              >
                                <FileText className="h-4 w-4" />
                                מכתב קבלה
                              </button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleRemoveFile(uni.originalIndex)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={uploadingFor === uni.originalIndex}
                              onClick={() => {
                                setUploadingFor(uni.originalIndex);
                                fileInputRef.current?.click();
                              }}
                              className="gap-1"
                            >
                              <Upload className="h-3 w-3" />
                              {uploadingFor === uni.originalIndex ? 'מעלה...' : 'העלה מכתב'}
                            </Button>
                          )}
                          
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveUniversity(uni.originalIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => {
                if (uploadingFor !== null) {
                  handleFileUpload(e, uploadingFor);
                }
              }}
            />
          </div>

          {/* Applied Universities Section */}
          <div className="space-y-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <Label className="text-base font-semibold">אוניברסיטאות שהוגש אליהן</Label>

            {/* Add new applied university */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Select value={newAppliedCountry} onValueChange={setNewAppliedCountry}>
                  <SelectTrigger className={!newAppliedCountry && newAppliedName.trim() ? 'border-orange-300 bg-orange-50' : ''}>
                    <SelectValue placeholder="בחר מדינה *" />
                  </SelectTrigger>
                  <SelectContent>
                    {countryOptions.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <UniversityDropdown
                  value={newAppliedName}
                  onChange={setNewAppliedName}
                  placeholder="שם האוניברסיטה *"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Select value={newAppliedDegreeType} onValueChange={setNewAppliedDegreeType}>
                  <SelectTrigger>
                    <SelectValue placeholder="סוג תואר" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="תואר ראשון">תואר ראשון</SelectItem>
                    <SelectItem value="תואר שני">תואר שני</SelectItem>
                    <SelectItem value="דוקטורט">דוקטורט</SelectItem>
                    <SelectItem value="אחר">אחר</SelectItem>
                  </SelectContent>
                </Select>
                <FieldAutocomplete
                  value={newAppliedField}
                  onChange={setNewAppliedField}
                  placeholder="תחום לימודים"
                />
                <Input
                  value={newAppliedStudyYear}
                  onChange={(e) => setNewAppliedStudyYear(e.target.value)}
                  placeholder="שנת לימודים"
                />
              </div>
              {newAppliedDegreeType === 'אחר' && (
                <Input
                  value={newAppliedDegreeTypeOther}
                  onChange={(e) => setNewAppliedDegreeTypeOther(e.target.value)}
                  placeholder="סוג תואר אחר..."
                />
              )}
              <div className="grid grid-cols-2 gap-2">
                <Select value={newAppliedStatus} onValueChange={setNewAppliedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="סטטוס בקשה" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(applicationStatusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={newAppliedNotes}
                  onChange={(e) => setNewAppliedNotes(e.target.value)}
                  placeholder="הערות (אופציונלי)"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (!newAppliedName.trim() || !newAppliedCountry.trim()) return;
                  setAppliedUniversities(prev => [
                    ...prev,
                    {
                      name: newAppliedName.trim(),
                      country: newAppliedCountry.trim(),
                      degreeType: newAppliedDegreeType || undefined,
                      degreeTypeOther: newAppliedDegreeType === 'אחר' ? newAppliedDegreeTypeOther : undefined,
                      field: newAppliedField || undefined,
                      studyYear: newAppliedStudyYear || undefined,
                      applicationStatus: newAppliedStatus || 'submitted',
                      notes: newAppliedNotes || undefined,
                    }
                  ]);
                  setNewAppliedName('');
                  setNewAppliedCountry('');
                  setNewAppliedDegreeType('');
                  setNewAppliedDegreeTypeOther('');
                  setNewAppliedField('');
                  setNewAppliedStudyYear('');
                  setNewAppliedStatus('submitted');
                  setNewAppliedNotes('');
                }}
                disabled={!newAppliedCountry || !newAppliedName.trim()}
                className="w-full"
              >
                <Plus className="h-4 w-4 ml-2" />
                הוסף הגשה
              </Button>
            </div>

            {/* List of applied universities - grouped by country */}
            {appliedUniversities.length > 0 && (
              <div className="space-y-3">
                {Object.entries(
                  appliedUniversities.reduce((acc, uni, index) => {
                    const country = uni.country || 'ללא מדינה';
                    if (!acc[country]) acc[country] = [];
                    acc[country].push({ ...uni, originalIndex: index });
                    return acc;
                  }, {} as Record<string, ((typeof appliedUniversities)[number] & { originalIndex: number })[]>)
                ).map(([country, universities]) => (
                  <div key={country} className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground px-1">{country}</div>
                    <div className="space-y-1">
                      {universities.map((uni) => (
                        <div key={uni.originalIndex} className="flex items-start gap-2 p-2.5 bg-background rounded-lg border">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{uni.name}</span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                {applicationStatusLabels[uni.applicationStatus || 'submitted'] || uni.applicationStatus}
                              </span>
                            </div>
                            {[
                              uni.degreeType === 'אחר' ? uni.degreeTypeOther : uni.degreeType,
                              uni.field,
                              uni.studyYear
                            ].filter(Boolean).length > 0 && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {[
                                  uni.degreeType === 'אחר' ? uni.degreeTypeOther : uni.degreeType,
                                  uni.field,
                                  uni.studyYear
                                ].filter(Boolean).join(' • ')}
                              </div>
                            )}
                            {uni.notes && (
                              <div className="text-xs text-muted-foreground mt-1 italic">{uni.notes}</div>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setAppliedUniversities(prev => prev.filter((_, i) => i !== uni.originalIndex))}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">מקור הגעה</Label>
            <Select 
              value={sourceSelection} 
              onValueChange={(v) => {
                setSourceSelection(v);
                if (v !== 'אחר') {
                  setFormData({ ...formData, source: v });
                  setCustomSource('');
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר מקור" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-[100] max-h-60 overflow-y-auto" position="popper" sideOffset={4}>
                {sourceOptions.map((src) => (
                  <SelectItem key={src} value={src}>{src}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {sourceSelection === 'אחר' && (
              <Input
                placeholder="הזן מקור אחר..."
                value={customSource}
                onChange={(e) => {
                  setCustomSource(e.target.value);
                  setFormData({ ...formData, source: e.target.value });
                }}
                className="mt-2"
              />
            )}
          </div>

          {/* Payment Reminder Date */}
          <div className="space-y-2">
            <Label>תאריך תזכורת לתשלום</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-right font-normal",
                    !formData.paymentReminderDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="ml-2 h-4 w-4" />
                  {formData.paymentReminderDate ? (
                    format(formData.paymentReminderDate, "dd/MM/yyyy", { locale: he })
                  ) : (
                    <span>בחר תאריך תזכורת</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={formData.paymentReminderDate}
                  onSelect={(date) => setFormData({ ...formData, paymentReminderDate: date })}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            {formData.paymentReminderDate && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFormData({ ...formData, paymentReminderDate: undefined })}
                className="text-xs text-muted-foreground"
              >
                <X className="h-3 w-3 ml-1" />
                הסר תאריך תזכורת
              </Button>
            )}
          </div>

          {/* Toggles for payment and agreement */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <Label htmlFor="isPaid" className="cursor-pointer">שולם</Label>
              <Switch
                id="isPaid"
                checked={formData.isPaid}
                onCheckedChange={(checked) => setFormData({ ...formData, isPaid: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="signedAgreement" className="cursor-pointer">חתם על הסכם</Label>
              <Switch
                id="signedAgreement"
                checked={formData.signedAgreement}
                onCheckedChange={(checked) => setFormData({ ...formData, signedAgreement: checked })}
              />
            </div>
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

          {/* Conversation Log - Read Only */}
          {conversations.length > 0 && (
            <div className="space-y-3 p-4 bg-blue-50/50 rounded-lg border border-blue-200">
              <Label className="text-base font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                יומן שיחות מהיועץ ({conversations.length})
              </Label>
              <ScrollArea className="max-h-48">
                <div className="space-y-3 pr-4">
                  {conversations.map((conv) => (
                    <div key={conv.id} className="p-3 bg-background rounded-lg border space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(conv.conversation_date), "dd/MM/yyyy HH:mm", { locale: he })}
                        </span>
                        {conv.advisor_name && (
                          <span className="text-blue-600">{conv.advisor_name}</span>
                        )}
                      </div>
                      <p className="text-sm">{conv.summary}</p>
                      {conv.follow_up_actions && (
                        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded mt-1">
                          <strong>פעולות להמשך:</strong> {conv.follow_up_actions}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

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
