import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, X } from 'lucide-react';

const COUNTRIES = [
  'אנגליה',
  'ארה״ב',
  'קנדה',
  'הולנד',
  'גרמניה',
  'אוסטרליה',
  'צרפת',
  'איטליה',
  'ספרד',
  'אירלנד',
];

interface MultiCountrySelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MultiCountrySelect({ value, onChange, placeholder = 'בחר מדינות' }: MultiCountrySelectProps) {
  const [open, setOpen] = useState(false);
  
  // Parse comma-separated string to array
  const selectedCountries = value ? value.split(', ').filter(Boolean) : [];

  const toggleCountry = (country: string) => {
    const newSelection = selectedCountries.includes(country)
      ? selectedCountries.filter(c => c !== country)
      : [...selectedCountries, country];
    
    onChange(newSelection.join(', '));
  };

  const removeCountry = (country: string) => {
    const newSelection = selectedCountries.filter(c => c !== country);
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
            {selectedCountries.length > 0 ? (
              selectedCountries.map((country) => (
                <Badge
                  key={country}
                  variant="secondary"
                  className="gap-1 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeCountry(country);
                  }}
                >
                  {country}
                  <X className="h-3 w-3 cursor-pointer hover:text-destructive" />
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50 mr-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-2 bg-popover z-50" align="start">
        <div className="space-y-1">
          {COUNTRIES.map((country) => (
            <div
              key={country}
              className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer"
              onClick={() => toggleCountry(country)}
            >
              <Checkbox
                checked={selectedCountries.includes(country)}
                onCheckedChange={() => toggleCountry(country)}
              />
              <span className="text-sm">{country}</span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
