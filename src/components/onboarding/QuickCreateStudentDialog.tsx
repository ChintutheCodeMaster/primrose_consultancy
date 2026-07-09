import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, GraduationCap, Loader2, UserPlus } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  open: boolean;
  onClose: () => void;
}

const DEGREE_OPTIONS: { value: string; label: string }[] = [
  { value: 'bachelor', label: "Bachelor's" },
  { value: 'master', label: "Master's" },
  { value: 'mba', label: 'MBA' },
  { value: 'doctorate', label: 'PhD / Doctorate' },
  { value: 'high_school', label: 'High School / Boarding' },
];

export function QuickCreateStudentDialog({ open, onClose }: Props) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [degreeType, setDegreeType] = useState('bachelor');
  const [saving, setSaving] = useState(false);
  const [advisorId, setAdvisorId] = useState<string | null>(null);
  const [advisorName, setAdvisorName] = useState<string>('');

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('advisors')
        .select('id, name')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setAdvisorId(data.id);
        setAdvisorName(data.name ?? '');
      }
    })();
  }, [open]);

  const submit = async () => {
    if (!name.trim()) {
      toast.error('Please enter a name.');
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .insert({
          name: name.trim(),
          email: email.trim(),
          phone: '',
          degree_type: degreeType,
          source: 'Direct signup',
          status: 'active',
          advisor_id: advisorId,
          advisor_name: advisorName,
          payment_type: 'package',
          package_cost: 0,
          amount_paid: 0,
          is_paid: false,
          signed_agreement: false,
        })
        .select('id')
        .single();

      if (error) throw error;
      toast.success('Your first student is ready.');
      onClose();
      if (data?.id) navigate(`/students/${data.id}/workspace`);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? 'Could not create student.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !saving && onClose()}>
      <DialogContent
        hideClose
        className="max-w-md p-0 overflow-hidden bg-gradient-to-br from-violet-50 via-white to-rose-50 border-none"
      >
        <div className="px-7 pt-8 pb-7">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-600 to-rose-500 text-white shadow-lg shadow-violet-500/25 mb-4">
              <GraduationCap className="h-5 w-5" />
            </div>
            <h2
              className="text-2xl font-bold tracking-tight"
              style={{ fontFamily: 'Sora, Inter, sans-serif' }}
            >
              Add your first student
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              You can edit or add more details later.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="quick-student-name" className="text-xs font-medium">
                Student name<span className="text-rose-500">*</span>
              </Label>
              <Input
                id="quick-student-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Grace Hopper"
                className="mt-1.5"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="quick-student-email" className="text-xs font-medium text-muted-foreground">
                Email <span className="text-slate-400">(optional)</span>
              </Label>
              <Input
                id="quick-student-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="grace@example.com"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Applying for</Label>
              <Select value={degreeType} onValueChange={setDegreeType}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEGREE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={submit}
            disabled={saving || !name.trim()}
            size="lg"
            className="mt-7 w-full gap-2 bg-gradient-to-r from-violet-600 to-rose-500 hover:from-violet-700 hover:to-rose-600 text-white border-0 shadow-md shadow-violet-500/25"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Creating…
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" /> Create student <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="mt-3 w-full text-xs text-muted-foreground hover:text-foreground transition"
          >
            Skip for now
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
