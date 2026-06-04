import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, ChevronDown, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MultiUniversitySelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function MultiUniversitySelect({
  value,
  onChange,
  placeholder = "Select target universities",
  className
}: MultiUniversitySelectProps) {
  const [options, setOptions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [customValue, setCustomValue] = useState('');
  const [showAddCustom, setShowAddCustom] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedValues = value ? value.split(', ').filter(Boolean) : [];

  useEffect(() => {
    const fetchOptions = async () => {
      const { data } = await supabase
        .from('target_university_options')
        .select('name')
        .order('sort_order');
      if (data) {
        setOptions(data.map(d => d.name));
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
        setShowAddCustom(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    const newSelected = selectedValues.includes(option)
      ? selectedValues.filter(v => v !== option)
      : [...selectedValues, option];
    onChange(newSelected.join(', '));
  };

  const removeOption = (option: string) => {
    onChange(selectedValues.filter(v => v !== option).join(', '));
  };

  const handleAddCustom = async () => {
    const trimmed = customValue.trim();
    if (!trimmed) return;

    // Add to DB for future use
    const { error } = await supabase
      .from('target_university_options')
      .insert({ name: trimmed, sort_order: options.length + 1 });

    if (error) {
      if (error.code === '23505') {
        // Already exists, just select it
      } else {
        toast.error('Error adding university');
        return;
      }
    }

    // Add to local options if not already there
    if (!options.includes(trimmed)) {
      setOptions(prev => [...prev, trimmed]);
    }

    // Select it
    if (!selectedValues.includes(trimmed)) {
      onChange([...selectedValues, trimmed].join(', '));
    }

    setCustomValue('');
    setShowAddCustom(false);
    toast.success(`${trimmed} added to the list`);
  };

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <div
        className="min-h-10 px-3 py-2 border rounded-md bg-background cursor-pointer flex flex-wrap gap-1 items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedValues.length === 0 && (
          <span className="text-muted-foreground text-sm">{placeholder}</span>
        )}
        {selectedValues.map(val => (
          <Badge key={val} variant="secondary" className="gap-1 text-xs">
            {val}
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                removeOption(val);
              }}
            />
          </Badge>
        ))}
        <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto flex-shrink-0" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg">
          <div className="p-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search university..."
              className="h-8 text-sm"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.map(option => (
              <button
                key={option}
                type="button"
                className={cn(
                  "w-full px-3 py-1.5 text-sm text-left hover:bg-muted transition-colors flex items-center gap-2",
                  selectedValues.includes(option) && "bg-primary/10 font-medium"
                )}
                onClick={() => toggleOption(option)}
              >
                <span className={cn(
                  "w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-xs",
                  selectedValues.includes(option) ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"
                )}>
                  {selectedValues.includes(option) && "✓"}
                </span>
                {option}
              </button>
            ))}
            {filteredOptions.length === 0 && (
              <p className="px-3 py-2 text-sm text-muted-foreground">No results found</p>
            )}
          </div>
          <div className="border-t p-2">
            {!showAddCustom ? (
              <button
                type="button"
                className="w-full px-3 py-1.5 text-sm text-left hover:bg-muted transition-colors flex items-center gap-2 text-primary"
                onClick={() => setShowAddCustom(true)}
              >
                <Plus className="h-4 w-4" />
                Add new university
              </button>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  placeholder="University name..."
                  className="h-8 text-sm flex-1"
                  dir="ltr"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustom())}
                />
                <Button type="button" size="sm" className="h-8" onClick={handleAddCustom}>
                  Add
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}