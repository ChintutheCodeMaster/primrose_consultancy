import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface DueReminder {
  id: string;
  name: string;
  graduation_year: string | null;
  follow_up_reminder_date: string;
  follow_up_reminder_note: string | null;
}

export function FollowUpReminderPopup() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const { data: dueReminders = [] } = useQuery({
    queryKey: ['follow-up-reminders-due'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('students')
        .select('id, name, graduation_year, follow_up_reminder_date, follow_up_reminder_note')
        .lte('follow_up_reminder_date', today)
        .eq('follow_up_reminder_dismissed', false)
        .not('follow_up_reminder_date', 'is', null);
      if (error) throw error;
      return (data || []) as DueReminder[];
    },
    refetchInterval: 1000 * 60 * 10, // 10 minutes
  });

  useEffect(() => {
    if (dueReminders.length > 0) {
      setOpen(true);
      setIndex(0);
    }
  }, [dueReminders.length]);

  const dismissMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const { error } = await supabase
        .from('students')
        .update({ follow_up_reminder_dismissed: true })
        .eq('id', studentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-up-reminders-due'] });
      toast.success('Reminder marked as handled');
    },
  });

  const snoozeMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      const { error } = await supabase
        .from('students')
        .update({ follow_up_reminder_date: d.toISOString().split('T')[0] })
        .eq('id', studentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-up-reminders-due'] });
      toast.success('Reminder snoozed for a week');
    },
  });

  if (!dueReminders.length) return null;
  const current = dueReminders[Math.min(index, dueReminders.length - 1)];
  if (!current) return null;

  const handleNext = () => {
    if (index + 1 < dueReminders.length) {
      setIndex(index + 1);
    } else {
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Follow-up Reminder ({index + 1}/{dueReminders.length})
          </DialogTitle>
          <DialogDescription>
            It's time to check in with <strong>{current.name}</strong>
            {current.graduation_year ? ` (Alumnus ${current.graduation_year})` : ''}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2 space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Reminder Date: </span>
            {new Date(current.follow_up_reminder_date).toLocaleDateString('en-US')}
          </div>
          {current.follow_up_reminder_note && (
            <div className="bg-muted/50 rounded p-3">
              <div className="text-xs text-muted-foreground mb-1">Note:</div>
              <div>{current.follow_up_reminder_note}</div>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => snoozeMutation.mutate(current.id)}
            disabled={snoozeMutation.isPending}
          >
            Snooze for a week
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const url = current.graduation_year
                ? `/past-clients/${current.graduation_year}?highlight=${current.id}`
                : `/students?highlight=${current.id}`;
              setOpen(false);
              navigate(url);
            }}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Open Student
          </Button>
          <Button
            onClick={() => {
              dismissMutation.mutate(current.id, { onSuccess: handleNext });
            }}
            disabled={dismissMutation.isPending}
          >
            Mark as Handled
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}