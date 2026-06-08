import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Briefcase, DollarSign } from 'lucide-react';

export function PendingPaymentProjects() {
  const navigate = useNavigate();

  const { data: projects = [] } = useQuery({
    queryKey: ['pending-payment-projects'],
    queryFn: async () => {
      const { data: ps, error } = await supabase
        .from('projects')
        .select('id, name, amount, collaboration_id')
        .eq('status', 'pending_payment');
      if (error) throw error;
      const ids = [...new Set((ps || []).map((p) => p.collaboration_id).filter(Boolean))];
      let map = new Map<string, string>();
      if (ids.length) {
        const { data: cs } = await supabase.from('collaborations').select('id, name').in('id', ids);
        map = new Map((cs || []).map((c) => [c.id, c.name]));
      }
      return (ps || []).map((p) => ({
        ...p,
        collaborationName: p.collaboration_id ? map.get(p.collaboration_id) || '' : '',
      }));
    },
  });

  if (projects.length === 0) return null;

  return (
    <div className="rounded-xl border border-warning/30 bg-card p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Briefcase className="h-4 w-4 text-warning" />
        Pending payment collaborations ({projects.length})
      </h3>
      <div className="space-y-2">
        {projects.map((p) => (
          <div
            key={p.id}
            className="flex cursor-pointer items-center justify-between rounded-lg bg-warning/10 p-3 transition-colors hover:bg-warning/20"
            onClick={() => navigate('/projects')}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning/20 flex-shrink-0">
                <DollarSign className="h-4 w-4 text-warning" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{p.name}</p>
                {p.collaborationName && (
                  <p className="text-xs text-muted-foreground truncate">{p.collaborationName}</p>
                )}
              </div>
            </div>
            {p.amount != null && (
              <span className="text-sm font-medium flex-shrink-0">${p.amount.toLocaleString()}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
