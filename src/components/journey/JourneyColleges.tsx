import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getProgramTerms } from '@/lib/programTerms';

const BUCKET_COLOR: Record<string, string> = {
  reach: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  target: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  likely: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  safety: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
};

export function JourneyColleges({ studentId, degreeType }: { studentId: string; degreeType?: string | null }) {
  const [colleges, setColleges] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const terms = getProgramTerms(degreeType);

  const load = async () => {
    const { data } = await supabase
      .from('student_colleges')
      .select('*')
      .eq('student_id', studentId)
      .order('sort_order');
    setColleges(data || []);
  };

  useEffect(() => {
    load();
  }, [studentId]);

  const grouped = ['reach', 'target', 'likely', 'safety'].map((b) => ({
    bucket: b,
    items: colleges.filter((c) => c.list_bucket === b),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{terms.sectionTitle}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{terms.listSubtitle}</p>
        </div>
        <AddCollegeDialog
          studentId={studentId}
          open={open}
          onOpenChange={setOpen}
          onAdded={load}
          terms={terms}
        />
      </div>

      {colleges.length === 0 && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No {terms.nounPlural} yet — add your first one above.
          </CardContent>
        </Card>
      )}

      {grouped.map(
        (g) =>
          g.items.length > 0 && (
            <div key={g.bucket}>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className={BUCKET_COLOR[g.bucket]}>
                  {g.bucket.toUpperCase()}
                </Badge>
                <span className="text-xs text-muted-foreground">{g.items.length}</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {g.items.map((c) => {
                  const days = c.deadline
                    ? Math.ceil((new Date(c.deadline).getTime() - Date.now()) / 86400000)
                    : null;
                  return (
                    <Card key={c.id}>
                      <CardContent className="p-4">
                        <div className="font-semibold">{c.college_name}</div>
                        <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-2">
                          {c.application_plan && <span>{c.application_plan}</span>}
                          {c.deadline && (
                            <span>
                              · {new Date(c.deadline).toLocaleDateString()}
                              {days !== null && ` (${days >= 0 ? `${days}d left` : `${-days}d ago`})`}
                            </span>
                          )}
                          <span>· {c.status}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ),
      )}
    </div>
  );
}

function AddCollegeDialog({
  studentId,
  open,
  onOpenChange,
  onAdded,
}: {
  studentId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdded: () => void;
}) {
  const [name, setName] = useState('');
  const [bucket, setBucket] = useState('target');
  const [plan, setPlan] = useState('');
  const [deadline, setDeadline] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName('');
    setBucket('target');
    setPlan('');
    setDeadline('');
  };

  const save = async () => {
    if (!name.trim()) {
      toast.error('College name is required');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('student_colleges').insert({
      student_id: studentId,
      college_name: name.trim(),
      list_bucket: bucket,
      application_plan: plan || null,
      deadline: deadline || null,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('College added');
    reset();
    onOpenChange(false);
    onAdded();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1 shrink-0">
          <Plus className="h-4 w-4" /> Add college
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add a college</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>College name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Brown University" />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={bucket} onValueChange={setBucket}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reach">Reach</SelectItem>
                <SelectItem value="target">Target</SelectItem>
                <SelectItem value="likely">Likely</SelectItem>
                <SelectItem value="safety">Safety</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Application plan</Label>
              <Input value={plan} onChange={(e) => setPlan(e.target.value)} placeholder="ED, EA, RD…" />
            </div>
            <div>
              <Label>Deadline</Label>
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
