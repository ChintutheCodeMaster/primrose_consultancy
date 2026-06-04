import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface UniversitySuggestion {
  name: string;
  country: string;
}

interface UniversityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectSuggestion?: (suggestion: UniversitySuggestion) => void;
  placeholder?: string;
  className?: string;
}

export function UniversityAutocomplete({
  value,
  onChange,
  onSelectSuggestion,
  placeholder = "University Name",
  className
}: UniversityAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<UniversitySuggestion[]>([]);
  const [allUniversities, setAllUniversities] = useState<UniversitySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Fetch all unique universities on mount
  useEffect(() => {
    const fetchUniversities = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('accepted_universities')
        .select('name, country')
        .not('name', 'is', null);
      
      if (data) {
        // Get unique combinations of name and country
        const uniqueMap = new Map<string, UniversitySuggestion>();
        data.forEach(uni => {
          const key = `${uni.name}-${uni.country || ''}`;
          if (!uniqueMap.has(key) && uni.name) {
            uniqueMap.set(key, { name: uni.name, country: uni.country || '' });
          }
        });
        setAllUniversities(Array.from(uniqueMap.values()));
      }
      setLoading(false);
    };

    fetchUniversities();
  }, []);

  // Filter suggestions based on input
  useEffect(() => {
    if (value.length >= 2) {
      const filtered = allUniversities.filter(uni => 
        uni.name.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 8)); // Limit to 8 suggestions
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [value, allUniversities]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (suggestion: UniversitySuggestion) => {
    onChange(suggestion.name);
    if (onSelectSuggestion) {
      onSelectSuggestion(suggestion);
    }
    setShowSuggestions(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => value.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
        placeholder={placeholder}
        className={className}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.name}-${suggestion.country}-${index}`}
              type="button"
              className={cn(
                "w-full px-3 py-2 text-left hover:bg-muted transition-colors",
                "flex justify-between items-center gap-2"
              )}
              onClick={() => handleSelect(suggestion)}
            >
              <span className="font-medium truncate">{suggestion.name}</span>
              {suggestion.country && (
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {suggestion.country}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}