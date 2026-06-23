import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AdvisorOption {
  id: string;
  name: string;
}

interface SingleAdvisorSelectProps {
  value: string; // advisor.id
  onChange: (advisor: AdvisorOption | null) => void;
  placeholder?: string;
  includeInactive?: boolean;
  disabled?: boolean;
}

const NONE_VALUE = '__none__';

export function SingleAdvisorSelect({
  value,
  onChange,
  placeholder = 'Select consultant',
  includeInactive = false,
  disabled = false,
}: SingleAdvisorSelectProps) {
  const { data: advisors = [] } = useQuery({
    queryKey: ['advisors-select-single', includeInactive],
    queryFn: async () => {
      let query = supabase.from('advisors').select('id, name').order('name');
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as AdvisorOption[];
    },
  });

  return (
    <Select
      value={value || NONE_VALUE}
      onValueChange={(v) => {
        if (v === NONE_VALUE) {
          onChange(null);
          return;
        }
        const picked = advisors.find((a) => a.id === v);
        onChange(picked ?? null);
      }}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE_VALUE}>
          <span className="text-muted-foreground">No consultant</span>
        </SelectItem>
        {advisors.map((a) => (
          <SelectItem key={a.id} value={a.id}>
            {a.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
