import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CalendarDays, ExternalLink, Plus, Loader2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function JourneyTasks({ studentId }: { studentId: string }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from('student_tasks')
      .select('*')
      .eq('student_id', studentId)
      .order('status')
      .order('due_date', { ascending: true, nullsFirst: false });
    setTasks(data || []);
  };

  useEffect(() => {
    load();
  }, [studentId]);

  const toggle = async (id: string, done: boolean) => {
    await supabase
      .from('student_tasks')
      .update({ status: done ? 'done' : 'todo' })
      .eq('id', id);
    load();
  };

  const openTasks = tasks.filter((t) => t.status !== 'done');
  const done = tasks.filter((t) => t.status === 'done');

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Your to-dos — from your consultant or things you want to track yourself.
          </p>
        </div>
        <AddTaskDialog studentId={studentId} open={open} onOpenChange={setOpen} onAdded={load} />
      </div>

      {openTasks.length === 0 && done.length === 0 && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No tasks yet — add one above.
          </CardContent>
        </Card>
      )}

      {openTasks.length > 0 && (
        <div className="space-y-2">
          {openTasks.map((t) => (
            <TaskRow key={t.id} task={t} onToggle={toggle} />
          ))}
        </div>
      )}

      {done.length > 0 && (
        <div>
          <h2 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Completed</h2>
          <div className="space-y-2">
            {done.map((t) => (
              <TaskRow key={t.id} task={t} onToggle={toggle} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, onToggle }: { task: any; onToggle: (id: string, done: boolean) => void }) {
  const done = task.status === 'done';
  return (
    <Card>
      <CardContent className="p-4 flex items-start gap-3">
        <Checkbox checked={done} onCheckedChange={(v) => onToggle(task.id, !!v)} className="mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className={cn('font-medium', done && 'line-through text-muted-foreground')}>{task.title}</div>
          {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            {task.due_date && (
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {new Date(task.due_date).toLocaleDateString()}
              </span>
            )}
            {task.created_by === 'student' && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" /> Added by you
              </span>
            )}
            {task.link_url && (
              <a
                href={task.link_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" /> Open link
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AddTaskDialog({
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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setTitle('');
    setDescription('');
    setDueDate('');
    setLinkUrl('');
  };

  const save = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('student_tasks').insert({
      student_id: studentId,
      title: title.trim(),
      description: description || null,
      due_date: dueDate || null,
      link_url: linkUrl || null,
      created_by: 'student',
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Task added');
    reset();
    onOpenChange(false);
    onAdded();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1 shrink-0">
          <Plus className="h-4 w-4" /> Add task
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add a task</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Draft Common App essay" />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Due date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div>
              <Label>Link</Label>
              <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://…" />
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
