import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
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
import { Switch } from '@/components/ui/switch';
import {
  Plus,
  Loader2,
  MapPin,
  Bell,
  CalendarDays,
  ExternalLink,
  Pencil,
  Trash2,
  User,
  Briefcase,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Mode = 'student' | 'counselor';

const TYPE_META: Record<string, { label: string; color: string; dot: string }> = {
  meeting: {
    label: 'Meeting',
    color:
      'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 border-sky-200 dark:border-sky-900',
    dot: 'bg-sky-500',
  },
  deadline: {
    label: 'Deadline',
    color:
      'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-900',
    dot: 'bg-rose-500',
  },
  test: {
    label: 'Test',
    color:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-900',
    dot: 'bg-amber-500',
  },
  reminder: {
    label: 'Reminder',
    color:
      'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border-violet-200 dark:border-violet-900',
    dot: 'bg-violet-500',
  },
  other: {
    label: 'Other',
    color:
      'bg-muted text-muted-foreground border-border',
    dot: 'bg-muted-foreground',
  },
};

const REMINDER_OPTS = [
  { value: 'none', label: 'No reminder' },
  { value: '0', label: 'At time of event' },
  { value: '10', label: '10 minutes before' },
  { value: '30', label: '30 minutes before' },
  { value: '60', label: '1 hour before' },
  { value: '180', label: '3 hours before' },
  { value: '1440', label: '1 day before' },
  { value: '2880', label: '2 days before' },
  { value: '10080', label: '1 week before' },
];

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toLocalDateOnly(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function gcalLink(ev: any) {
  const start = new Date(ev.start_at);
  const end = ev.end_at ? new Date(ev.end_at) : new Date(start.getTime() + 60 * 60 * 1000);
  const fmt = (d: Date) =>
    ev.all_day
      ? d.toISOString().slice(0, 10).replace(/-/g, '')
      : d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const dates = ev.all_day
    ? `${fmt(start)}/${fmt(new Date(start.getTime() + 86400000))}`
    : `${fmt(start)}/${fmt(end)}`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: ev.title || 'Event',
    dates,
    details: ev.description || '',
    location: ev.location || '',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function JourneyCalendar({ studentId, mode }: { studentId: string; mode: Mode }) {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from('student_calendar_events' as any)
      .select('*')
      .eq('student_id', studentId)
      .order('start_at', { ascending: true });
    setEvents((data as any) || []);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`cal-${studentId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'student_calendar_events', filter: `student_id=eq.${studentId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const e of events) {
      const key = toLocalDateOnly(new Date(e.start_at));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return map;
  }, [events]);

  const selectedKey = toLocalDateOnly(selectedDate);
  const dayEvents = eventsByDay.get(selectedKey) || [];

  const upcoming = useMemo(() => {
    const now = Date.now();
    return events
      .filter((e) => new Date(e.start_at).getTime() >= now)
      .slice(0, 6);
  }, [events]);

  const daysWithEvents = useMemo(
    () => Array.from(eventsByDay.keys()).map((k) => new Date(k + 'T00:00:00')),
    [eventsByDay],
  );

  const remove = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    const { error } = await supabase.from('student_calendar_events' as any).delete().eq('id', id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Event deleted');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" /> Calendar
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Shared between you and your {mode === 'student' ? 'consultant' : 'student'}. Add meetings,
            deadlines, and reminders — they'll pop up in the portal when they're due.
          </p>
        </div>
        <Button
          className="gap-1 shrink-0"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> New event
        </Button>
      </div>

      <div className="grid lg:grid-cols-[auto_1fr] gap-6">
        <Card className="lg:w-[340px]">
          <CardContent className="p-3">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              modifiers={{ hasEvent: daysWithEvents }}
              modifiersClassNames={{
                hasEvent:
                  'relative after:content-[""] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-primary',
              }}
              className="pointer-events-auto"
            />
          </CardContent>
        </Card>

        <div className="space-y-5 min-w-0">
          <div>
            <h2 className="text-sm font-semibold mb-2">
              {selectedDate.toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </h2>
            {dayEvents.length === 0 ? (
              <Card>
                <CardContent className="p-4 text-sm text-muted-foreground">
                  Nothing scheduled for this day.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {dayEvents.map((e) => (
                  <EventCard
                    key={e.id}
                    ev={e}
                    onEdit={() => {
                      setEditing(e);
                      setOpen(true);
                    }}
                    onDelete={() => remove(e.id)}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Upcoming
            </h2>
            {upcoming.length === 0 ? (
              <Card>
                <CardContent className="p-4 text-sm text-muted-foreground">
                  No upcoming events.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {upcoming.map((e) => (
                  <EventCard
                    key={e.id}
                    ev={e}
                    compact
                    onEdit={() => {
                      setEditing(e);
                      setOpen(true);
                    }}
                    onDelete={() => remove(e.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <EventDialog
        open={open}
        onOpenChange={setOpen}
        studentId={studentId}
        mode={mode}
        defaultDate={selectedDate}
        editing={editing}
        onSaved={load}
      />
    </div>
  );
}

function EventCard({
  ev,
  compact,
  onEdit,
  onDelete,
}: {
  ev: any;
  compact?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const meta = TYPE_META[ev.event_type] || TYPE_META.other;
  const start = new Date(ev.start_at);
  const end = ev.end_at ? new Date(ev.end_at) : null;
  const dateLabel = ev.all_day
    ? start.toLocaleDateString()
    : `${start.toLocaleDateString()} · ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}${
        end ? ' – ' + end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
      }`;

  return (
    <Card className="group">
      <CardContent className={cn('p-3 flex items-start gap-3', compact && 'p-3')}>
        <div className={cn('mt-1.5 h-2 w-2 rounded-full shrink-0', meta.dot)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium truncate">{ev.title}</span>
            <Badge variant="outline" className={cn('text-[10px] h-5', meta.color)}>
              {meta.label}
            </Badge>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              {ev.created_by === 'student' ? (
                <>
                  <User className="h-3 w-3" /> Student
                </>
              ) : (
                <>
                  <Briefcase className="h-3 w-3" /> Consultant
                </>
              )}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
            <span>{dateLabel}</span>
            {ev.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {ev.location}
              </span>
            )}
            {ev.reminder_minutes_before != null && (
              <span className="flex items-center gap-1">
                <Bell className="h-3 w-3" /> {reminderLabel(ev.reminder_minutes_before)}
              </span>
            )}
          </div>
          {!compact && ev.description && (
            <p className="text-sm text-foreground/80 mt-2 whitespace-pre-wrap">{ev.description}</p>
          )}
        </div>
        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <a
            href={gcalLink(ev)}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
            title="Add to Google Calendar"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
          <button
            onClick={onEdit}
            className="text-xs text-muted-foreground hover:text-primary"
            title="Edit"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            onClick={onDelete}
            className="text-xs text-muted-foreground hover:text-destructive"
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function reminderLabel(min: number) {
  const opt = REMINDER_OPTS.find((o) => o.value === String(min));
  return opt ? opt.label : `${min} min before`;
}

function EventDialog({
  open,
  onOpenChange,
  studentId,
  mode,
  defaultDate,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  studentId: string;
  mode: Mode;
  defaultDate: Date;
  editing: any | null;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [eventType, setEventType] = useState('meeting');
  const [allDay, setAllDay] = useState(false);
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [reminder, setReminder] = useState('30');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setTitle(editing.title || '');
      setDescription(editing.description || '');
      setLocation(editing.location || '');
      setEventType(editing.event_type || 'meeting');
      setAllDay(!!editing.all_day);
      setStartAt(toLocalInput(new Date(editing.start_at)));
      setEndAt(editing.end_at ? toLocalInput(new Date(editing.end_at)) : '');
      setReminder(editing.reminder_minutes_before != null ? String(editing.reminder_minutes_before) : '');
    } else {
      const base = new Date(defaultDate);
      base.setHours(10, 0, 0, 0);
      const endBase = new Date(base.getTime() + 60 * 60 * 1000);
      setTitle('');
      setDescription('');
      setLocation('');
      setEventType('meeting');
      setAllDay(false);
      setStartAt(toLocalInput(base));
      setEndAt(toLocalInput(endBase));
      setReminder('30');
    }
  }, [open, editing, defaultDate]);

  const save = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!startAt) {
      toast.error('Start date/time is required');
      return;
    }
    setSaving(true);
    const payload = {
      student_id: studentId,
      title: title.trim(),
      description: description || null,
      location: location || null,
      event_type: eventType,
      all_day: allDay,
      start_at: new Date(startAt).toISOString(),
      end_at: endAt && !allDay ? new Date(endAt).toISOString() : null,
      reminder_minutes_before: reminder === '' ? null : Number(reminder),
      created_by: mode,
    };
    const res = editing
      ? await supabase.from('student_calendar_events' as any).update(payload).eq('id', editing.id)
      : await supabase.from('student_calendar_events' as any).insert(payload);
    setSaving(false);
    if (res.error) {
      toast.error(res.error.message);
      return;
    }
    toast.success(editing ? 'Event updated' : 'Event added');
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit event' : 'New event'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Strategy call" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {Object.entries(TYPE_META).map(([k, m]) => (
                    <SelectItem key={k} value={k}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2 pb-1">
              <Switch checked={allDay} onCheckedChange={setAllDay} id="allday" />
              <Label htmlFor="allday" className="cursor-pointer">All-day</Label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start</Label>
              <Input
                type={allDay ? 'date' : 'datetime-local'}
                value={allDay ? startAt.slice(0, 10) : startAt}
                onChange={(e) =>
                  setStartAt(allDay ? `${e.target.value}T00:00` : e.target.value)
                }
              />
            </div>
            {!allDay && (
              <div>
                <Label>End</Label>
                <Input
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                />
              </div>
            )}
          </div>
          <div>
            <Label>Location / link</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Zoom link, office, etc."
            />
          </div>
          <div>
            <Label>Reminder</Label>
            <Select value={reminder} onValueChange={setReminder}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {REMINDER_OPTS.map((o) => (
                  <SelectItem key={o.value || 'none'} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Anything to remember…"
            />
          </div>
        </div>
        <DialogFooter className="flex-wrap gap-2">
          {editing && (
            <a
              href={gcalLink({
                ...editing,
                title,
                description,
                location,
                start_at: new Date(startAt).toISOString(),
                end_at: endAt ? new Date(endAt).toISOString() : null,
                all_day: allDay,
              })}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mr-auto"
            >
              <ExternalLink className="h-3 w-3" /> Add to Google Calendar
            </a>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? 'Save' : 'Add event'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
