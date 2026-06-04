import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MultiAdvisorSelectProps {
  value: string; // comma-separated advisor names
  onChange: (value: string) => void;
  placeholder?: string;
  includeInactive?: boolean;
}

export function MultiAdvisorSelect({ value, onChange, placeholder = 'Select Consultants', includeInactive = false }: MultiAdvisorSelectProps) {
  const [open, setOpen] = useState(false);
  
  const { data: advisors = [] } = useQuery({
    queryKey: ['advisors-select', includeInactive],
    queryFn: async () => {
      let query = supabase
        .from('advisors')
        .select('id, name')
        .order('name');
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as { id: string; name: string }[];
    },
  });

  // Parse comma-separated string to array
  const selectedAdvisors = value ? value.split(', ').filter(Boolean) : [];

  const toggleAdvisor = (advisorName: string) => {
    const newSelection = selectedAdvisors.includes(advisorName)
      ? selectedAdvisors.filter(a => a !== advisorName)
      : [...selectedAdvisors, advisorName];
    
    onChange(newSelection.join(', '));
  };

  const removeAdvisor = (advisorName: string) => {
    const newSelection = selectedAdvisors.filter(a => a !== advisorName);
    onChange(newSelection.join(', '));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal h-auto min-h-10"
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selectedAdvisors.length > 0 ? (
              selectedAdvisors.map((advisor) => (
                <Badge
                  key={advisor}
                  variant="secondary"
                  className="gap-1 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAdvisor(advisor);
                  }}
                >
                  {advisor}
                  <X className="h-3 w-3 cursor-pointer hover:text-destructive" />
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-2 bg-popover z-50" align="start">
        <div className="space-y-1 max-h-[200px] overflow-y-auto">
          {advisors.map((advisor) => (
            <div
              key={advisor.id}
              className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer"
              onClick={() => toggleAdvisor(advisor.name)}
            >
              <Checkbox
                checked={selectedAdvisors.includes(advisor.name)}
                onCheckedChange={() => toggleAdvisor(advisor.name)}
              />
              <span className="text-sm">{advisor.name}</span>
            </div>
          ))}
          {advisors.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">No active consultants</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
