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
import { Student, StudentStatus, DegreeType, degreeTypeLabels, studentStatusLabels, AcceptedUniversity } from '@/types/crm';
import { Plus, Trash2, Upload, FileText, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Advisor {
  id: string;
  name: string;
}

interface EditStudentDialogProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (student: Student) => void;
}

export function EditStudentDialog({ student, open, onOpenChange, onSave }: EditStudentDialogProps) {
  const [formData, setFormData] = useState<Student | null>(null);
  const [newUniversityName, setNewUniversityName] = useState('');
  const [uploadingFor, setUploadingFor] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (student) {
      setFormData({ ...student });
    }
  }, [student]);

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
    if (newUniversityName.trim() && formData) {
      setFormData({
        ...formData,
        acceptedUniversities: [
          ...formData.acceptedUniversities,
          { name: newUniversityName.trim() }
        ]
      });
      setNewUniversityName('');
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
              required
            />
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
                value={formData.advisorName} 
                onValueChange={(v) => setFormData({ ...formData, advisorName: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר יועץ" />
                </SelectTrigger>
                <SelectContent>
                  {advisors.map((advisor) => (
                    <SelectItem key={advisor.id} value={advisor.name}>
                      {advisor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amountPaid">שולם בפועל (₪)</Label>
              <Input
                id="amountPaid"
                type="number"
                value={(formData as any).amountPaid || 0}
                onChange={(e) => setFormData({ ...formData, amountPaid: Number(e.target.value) } as any)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">יתרה לתשלום</Label>
              <div className="h-10 px-3 flex items-center rounded-md border bg-muted/50 text-muted-foreground">
                ₪{(formData.packageCost - ((formData as any).amountPaid || 0)).toLocaleString()}
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
            <div className="flex gap-2">
              <Input
                placeholder="שם האוניברסיטה"
                value={newUniversityName}
                onChange={(e) => setNewUniversityName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddUniversity())}
              />
              <Button type="button" variant="outline" size="icon" onClick={handleAddUniversity}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* List of accepted universities */}
            {formData.acceptedUniversities.length > 0 && (
              <div className="space-y-2">
                {formData.acceptedUniversities.map((uni, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-background rounded-lg border">
                    <span className="flex-1 font-medium">{uni.name}</span>
                    
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
            <Input
              id="source"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            />
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
