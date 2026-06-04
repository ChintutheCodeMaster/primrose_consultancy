import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarDays, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export function JourneyTasks({ studentId }: { studentId: string }) {
  const [tasks, setTasks] = useState<any[]>([]);

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

  const open = tasks.filter((t) => t.status !== 'done');
  const done = tasks.filter((t) => t.status === 'done');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Everything your consultant has asked you to do.
        </p>
      </div>

      {open.length === 0 && done.length === 0 && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">No tasks yet.</CardContent>
        </Card>
      )}

      {open.length > 0 && (
        <div className="space-y-2">
          {open.map((t) => (
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
