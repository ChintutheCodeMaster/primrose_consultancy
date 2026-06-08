import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Globe, UserPlus } from 'lucide-react';

export function NewWebsiteLeadsBanner() {
  const navigate = useNavigate();

  const { data: leads = [] } = useQuery({
    queryKey: ['new-website-leads'],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 7);
      const { data, error } = await supabase
        .from('leads')
        .select('id, name, created_at, source, leads_year')
        .eq('is_from_website', true)
        .eq('did_not_continue', false)
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  if (leads.length === 0) return null;

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 flex-shrink-0">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold">
              {leads.length === 1 ? 'New inquiry from website!' : `${leads.length} new inquiries from website!`}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {leads.map((l) => l.name).join(', ')}
            </p>
          </div>
        </div>
        <Button
          variant="outline" size="sm" className="gap-1.5 shrink-0"
          onClick={() => {
            const year = leads[0]?.leads_year;
            navigate(year ? `/leads/${year}` : '/leads/27');
          }}
        >
          <UserPlus className="h-3.5 w-3.5" />
          View Inquiries
        </Button>
      </div>
    </div>
  );
}
