import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UniversityDropdownProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function UniversityDropdown({ value, onChange, placeholder = "בחר אוניברסיטה" }: UniversityDropdownProps) {
  const [options, setOptions] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchOptions = async () => {
      const { data } = await supabase
        .from('target_university_options')
        .select('name')
        .order('sort_order');
      if (data) setOptions(data.map(d => d.name));
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
        setSearch('');
        setShowAddCustom(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  const addCustomOption = async () => {
    const trimmed = customValue.trim();
    if (!trimmed) return;

    const { error } = await supabase
      .from('target_university_options')
      .insert({ name: trimmed, sort_order: options.length + 1 });

    if (error && error.code !== '23505') {
      toast.error('שגיאה בהוספת אוניברסיטה');
      return;
    }

    if (!options.includes(trimmed)) {
      setOptions(prev => [...prev, trimmed]);
    }

    onChange(trimmed);
    setCustomValue('');
    setShowAddCustom(false);
    setDropdownOpen(false);
    setSearch('');
    toast.success(`${trimmed} נוספה לרשימה`);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <span className={value ? '' : 'text-muted-foreground'}>
          {value || placeholder}
        </span>
      </button>

      {dropdownOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          <div className="p-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חפש אוניברסיטה..."
              className="h-8 text-sm"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.map(option => (
              <button
                key={option}
                type="button"
                className={`w-full text-right px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors ${value === option ? 'bg-accent/50' : ''}`}
                onClick={() => {
                  onChange(option);
                  setDropdownOpen(false);
                  setSearch('');
                }}
              >
                {option}
              </button>
            ))}
            {filteredOptions.length === 0 && (
              <p className="px-3 py-2 text-sm text-muted-foreground">לא נמצאו תוצאות</p>
            )}
          </div>
          <div className="border-t p-2">
            {!showAddCustom ? (
              <button
                type="button"
                className="w-full text-right px-3 py-1.5 text-sm text-primary hover:bg-accent rounded flex items-center gap-1"
                onClick={() => setShowAddCustom(true)}
              >
                <Plus className="h-3 w-3" /> הוסף אוניברסיטה חדשה
              </button>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  placeholder="שם האוניברסיטה..."
                  className="h-8 text-sm flex-1"
                  dir="ltr"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomOption();
                    }
                  }}
                />
                <Button type="button" size="sm" className="h-8" onClick={addCustomOption}>
                  הוסף
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
