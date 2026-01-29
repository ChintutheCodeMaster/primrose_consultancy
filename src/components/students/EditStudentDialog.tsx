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
import { UniversityAutocomplete } from '@/components/ui/university-autocomplete';
import { Student, StudentStatus, DegreeType, degreeTypeLabels, studentStatusLabels, AcceptedUniversity } from '@/types/crm';
import { Plus, Trash2, Upload, FileText, X, MessageSquare, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSourceOptions } from '@/hooks/useSourceOptions';

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
  const [formData, setFormData] = useState<Student | null>(null);
  const [sourceSelection, setSourceSelection] = useState('');
  const [customSource, setCustomSource] = useState('');
  const [newUniversityName, setNewUniversityName] = useState('');
  const [newUniversityCountry, setNewUniversityCountry] = useState('');
  const [uploadingFor, setUploadingFor] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);

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
    }
  }, [student, open]);

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

  useEffect(() => {
    if (student) {
      // Normalize amountPaid because some callers may still provide snake_case (amount_paid)
      const rawAmountPaid = (student as any).amountPaid ?? (student as any).amount_paid ?? 0;
      const normalizedAmountPaid = Number(rawAmountPaid);

      setFormData({
        ...(student as any),
        amountPaid: Number.isFinite(normalizedAmountPaid) ? normalizedAmountPaid : 0,
      });
      // Check if the student's source matches one of the predefined options
      const currentSource = student.source || '';
      if (sourceOptions.includes(currentSource)) {
        setSourceSelection(currentSource);
        setCustomSource('');
      } else if (currentSource) {
        setSourceSelection('אחר');
        setCustomSource(currentSource);
      } else {
        setSourceSelection('');
        setCustomSource('');
      }
    }
  }, [student, sourceOptions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      // Save accepted universities to database
      if (student) {
        // Delete existing universities for this student
        await supabase
          .from('accepted_universities')
          .delete()
          .eq('student_id', student.id);

        // Insert new universities
        if (formData.acceptedUniversities.length > 0) {
          const { error } = await supabase
            .from('accepted_universities')
            .insert(
              formData.acceptedUniversities.map(uni => ({
                student_id: student.id,
                name: uni.name,
                country: uni.country || null,
                acceptance_letter_url: uni.acceptanceLetterUrl || null
              }))
            );
          
          if (error) {
            console.error('Error saving universities:', error);
            toast.error('שגיאה בשמירת האוניברסיטאות');
          }
        }
      }

      onSave(formData);
      onOpenChange(false);
    }
  };

  const handleAddUniversity = () => {
    if (newUniversityName.trim() && newUniversityCountry.trim() && formData) {
      setFormData({
        ...formData,
        acceptedUniversities: [
          ...formData.acceptedUniversities,
          { name: newUniversityName.trim(), country: newUniversityCountry.trim() }
        ]
      });
      setNewUniversityName('');
      setNewUniversityCountry('');
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
        .upload(fileName, file);

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
              <Input
                id="interestedField"
                value={formData.interestedField}
                onChange={(e) => setFormData({ ...formData, interestedField: e.target.value })}
              />
            </div>
          </div>

          {/* Student-specific fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="advisorName">יועץ</Label>
              <Select 
                value={formData.advisorId || ''} 
                onValueChange={(v) => {
                  const selectedAdvisor = advisors.find(a => a.id === v);
                  setFormData({ 
                    ...formData, 
                    advisorId: v,
                    advisorName: selectedAdvisor?.name || '' 
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר יועץ" />
                </SelectTrigger>
                <SelectContent>
                  {advisors.map((advisor) => (
                    <SelectItem key={advisor.id} value={advisor.id}>
                      {advisor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              type="number"
              value={formData.packageCost}
              onChange={(e) => setFormData({ ...formData, packageCost: Number(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amountPaid">שולם בפועל (₪)</Label>
              <Input
                id="amountPaid"
                type="number"
                dir="ltr"
                value={formData.amountPaid ?? 0}
                onChange={(e) => setFormData({ ...formData, amountPaid: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">יתרה לתשלום</Label>
              <div className="h-10 px-3 flex items-center rounded-md border bg-muted/50 text-muted-foreground">
                ₪{(formData.packageCost - (formData.amountPaid ?? 0)).toLocaleString()}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetCountry">מדינה נבחרת</Label>
              <Select value={formData.targetCountry || ''} onValueChange={(v) => setFormData({ ...formData, targetCountry: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר מדינה" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="אנגליה">אנגליה</SelectItem>
                  <SelectItem value="ארה״ב">ארה״ב</SelectItem>
                  <SelectItem value="קנדה">קנדה</SelectItem>
                  <SelectItem value="הולנד">הולנד</SelectItem>
                  <SelectItem value="גרמניה">גרמניה</SelectItem>
                  <SelectItem value="אוסטרליה">אוסטרליה</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetUniversity">אוניברסיטה נבחרת</Label>
              <Input
                id="targetUniversity"
                value={formData.targetUniversity}
                onChange={(e) => setFormData({ ...formData, targetUniversity: e.target.value })}
                placeholder="האוניברסיטה שהסטודנט בחר ללכת אליה"
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
                <Select value={newUniversityCountry} onValueChange={setNewUniversityCountry}>
                  <SelectTrigger className={!newUniversityCountry && newUniversityName.trim() ? 'border-orange-300 bg-orange-50' : ''}>
                    <SelectValue placeholder="בחר מדינה *" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="אנגליה">אנגליה</SelectItem>
                    <SelectItem value="ארה״ב">ארה״ב</SelectItem>
                    <SelectItem value="קנדה">קנדה</SelectItem>
                    <SelectItem value="הולנד">הולנד</SelectItem>
                    <SelectItem value="גרמניה">גרמניה</SelectItem>
                    <SelectItem value="אוסטרליה">אוסטרליה</SelectItem>
                    <SelectItem value="אירלנד">אירלנד</SelectItem>
                    <SelectItem value="צרפת">צרפת</SelectItem>
                    <SelectItem value="ספרד">ספרד</SelectItem>
                    <SelectItem value="אחר">אחר</SelectItem>
                  </SelectContent>
                </Select>
                <UniversityAutocomplete
                  value={newUniversityName}
                  onChange={setNewUniversityName}
                  onSelectSuggestion={(suggestion) => {
                    setNewUniversityName(suggestion.name);
                    if (suggestion.country) {
                      setNewUniversityCountry(suggestion.country);
                    }
                  }}
                  placeholder="שם האוניברסיטה *"
                />
              </div>
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

            {/* List of accepted universities */}
            {formData.acceptedUniversities.length > 0 && (
              <div className="space-y-2">
                {formData.acceptedUniversities.map((uni, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-background rounded-lg border">
                    <div className="flex-1">
                      <span className="font-medium">{uni.name}</span>
                      {uni.country && <span className="text-sm text-muted-foreground mr-2">({uni.country})</span>}
                    </div>
                    
                    {uni.acceptanceLetterUrl ? (
                      <div className="flex items-center gap-1">
                        <a
                          href={uni.acceptanceLetterUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <FileText className="h-4 w-4" />
                          מכתב קבלה
                        </a>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleRemoveFile(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploadingFor === index}
                        onClick={() => {
                          setUploadingFor(index);
                          fileInputRef.current?.click();
                        }}
                        className="gap-1"
                      >
                        <Upload className="h-3 w-3" />
                        {uploadingFor === index ? 'מעלה...' : 'העלה מכתב'}
                      </Button>
                    )}
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleRemoveUniversity(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
