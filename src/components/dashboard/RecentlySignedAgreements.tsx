import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Check, FileCheck, X } from 'lucide-react';
import { format } from 'date-fns';

export function RecentlySignedAgreements() {
  const qc = useQueryClient();

  const { data: agreements = [] } = useQuery({
    queryKey: ['recent-agreements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_agreements')
        .select('id, student_id, first_name, last_name, signed_at, notification_dismissed')
        .eq('notification_dismissed', false)
        .order('signed_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      const ids = (data || []).map((a) => a.student_id);
      const { data: studs } = await supabase.from('students').select('id, name').in('id', ids);
      const map = new Map((studs || []).map((s) => [s.id, s.name]));
      return (data || []).map((a) => ({
        id: a.id,
        studentName: map.get(a.student_id) || `${a.first_name} ${a.last_name}`,
        signedAt: new Date(a.signed_at),
      }));
    },
  });

  const dismiss = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('student_agreements').update({ notification_dismissed: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recent-agreements'] });
      toast({ title: 'Notification dismissed' });
    },
    onError: () => toast({ title: 'Error', description: 'Could not dismiss', variant: 'destructive' }),
  });

  if (agreements.length === 0) return null;

  return (
    <div className="rounded-xl border border-success/30 bg-success/10 p-4">
      <div className="mb-3 flex items-center gap-2">
        <FileCheck className="h-5 w-5 text-success" />
        <h2 className="text-lg font-semibold">Recently signed agreements</h2>
      </div>
      <div className="space-y-2">
        {agreements.map((a) => (
          <div key={a.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-card px-4 py-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/20">
                <Check className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="font-medium">{a.studentName}</p>
                <p className="text-xs text-muted-foreground">Signed on {format(a.signedAt, 'dd/MM/yyyy HH:mm')}</p>
              </div>
            </div>
            <Button
              variant="ghost" size="icon"
              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
              onClick={() => dismiss.mutate(a.id)}
              title="Dismiss"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
