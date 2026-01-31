import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, UserPlus, GraduationCap, Users, History } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: 'leads' | 'students' | 'did-not-continue-lead' | 'did-not-continue-student' | 'past-clients';
  locationLabel: string;
  navigateTo: string;
  year?: string;
}

interface GlobalSearchInputProps {
  placeholder?: string;
  className?: string;
  localSearchTerm?: string;
  onLocalSearchChange?: (value: string) => void;
  currentPage?: 'leads' | 'students' | 'past-clients' | 'did-not-continue';
}

export function GlobalSearchInput({ 
  placeholder = "חיפוש גלובלי...",
  className,
  localSearchTerm = '',
  onLocalSearchChange,
  currentPage
}: GlobalSearchInputProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState(localSearchTerm);
  const [globalResults, setGlobalResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync with external localSearchTerm
  useEffect(() => {
    setSearchTerm(localSearchTerm);
  }, [localSearchTerm]);

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    
    // Update local search if callback provided
    if (onLocalSearchChange) {
      onLocalSearchChange(term);
    }

    if (term.length < 2) {
      setGlobalResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    setShowDropdown(true);
    const results: SearchResult[] = [];

    try {
      // Search in leads
      const { data: leads } = await supabase
        .from('leads')
        .select('id, name, email, phone, did_not_continue, created_at')
        .or(`name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`);

      if (leads) {
        leads.forEach(lead => {
          const leadYear = new Date(lead.created_at).getFullYear();
          const yearPath = leadYear <= 2025 ? '2025-ומטה' : leadYear.toString();
          
          if (lead.did_not_continue) {
            results.push({
              id: lead.id,
              name: lead.name,
              email: lead.email,
              phone: lead.phone,
              location: 'did-not-continue-lead',
              locationLabel: 'לא המשיכו (מתעניין)',
              navigateTo: `/did-not-continue/${yearPath}?highlight=${lead.id}`
            });
          } else {
            results.push({
              id: lead.id,
              name: lead.name,
              email: lead.email,
              phone: lead.phone,
              location: 'leads',
              locationLabel: 'מתעניינים',
              navigateTo: `/leads?highlight=${lead.id}`
            });
          }
        });
      }

      // Search in students
      const { data: students } = await supabase
        .from('students')
        .select('id, name, email, phone, did_not_continue, graduation_year, created_at')
        .or(`name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`);

      if (students) {
        students.forEach(student => {
          const studentYear = new Date(student.created_at).getFullYear();
          const yearPath = studentYear <= 2025 ? '2025-ומטה' : studentYear.toString();
          
          if (student.did_not_continue) {
            results.push({
              id: student.id,
              name: student.name,
              email: student.email,
              phone: student.phone,
              location: 'did-not-continue-student',
              locationLabel: 'לא המשיכו (סטודנט)',
              navigateTo: `/did-not-continue/${yearPath}?highlight=${student.id}`
            });
          } else if (student.graduation_year) {
            results.push({
              id: student.id,
              name: student.name,
              email: student.email,
              phone: student.phone,
              location: 'past-clients',
              locationLabel: `לקוחות עבר ${student.graduation_year}`,
              navigateTo: `/past-clients/${student.graduation_year}?highlight=${student.id}`,
              year: student.graduation_year
            });
          } else {
            results.push({
              id: student.id,
              name: student.name,
              email: student.email,
              phone: student.phone,
              location: 'students',
              locationLabel: 'סטודנטים',
              navigateTo: `/students?highlight=${student.id}`
            });
          }
        });
      }

      setGlobalResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setShowDropdown(false);
    setSearchTerm('');
    if (onLocalSearchChange) {
      onLocalSearchChange('');
    }
    navigate(result.navigateTo);
  };

  const getLocationIcon = (location: string) => {
    switch (location) {
      case 'leads': return <UserPlus className="h-4 w-4" />;
      case 'students': return <GraduationCap className="h-4 w-4" />;
      case 'did-not-continue-lead':
      case 'did-not-continue-student':
        return <Users className="h-4 w-4" />;
      case 'past-clients': return <History className="h-4 w-4" />;
      default: return null;
    }
  };

  const getLocationColor = (location: string) => {
    switch (location) {
      case 'leads': return 'bg-primary/10 text-primary';
      case 'students': return 'bg-green-500/10 text-green-600';
      case 'did-not-continue-lead':
      case 'did-not-continue-student':
        return 'bg-muted text-muted-foreground';
      case 'past-clients': return 'bg-accent text-accent-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  // Filter out results that are from the current page (they'll show in local results)
  const externalResults = globalResults.filter(result => {
    if (!currentPage) return true;
    
    if (currentPage === 'leads' && result.location === 'leads') return false;
    if (currentPage === 'students' && result.location === 'students') return false;
    if (currentPage === 'past-clients' && result.location === 'past-clients') return false;
    if (currentPage === 'did-not-continue' && 
        (result.location === 'did-not-continue-lead' || result.location === 'did-not-continue-student')) return false;
    
    return true;
  });

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={() => {
          if (searchTerm.length >= 2 && globalResults.length > 0) {
            setShowDropdown(true);
          }
        }}
        className="pr-10"
      />
      
      {isSearching && (
        <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
      )}

      {/* Global Search Results Dropdown */}
      {showDropdown && externalResults.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-popover border border-border rounded-lg shadow-lg z-50 max-h-[400px] overflow-y-auto">
          <div className="p-2 border-b border-border bg-muted/50">
            <span className="text-xs text-muted-foreground font-medium">
              נמצא גם במקומות אחרים:
            </span>
          </div>
          <div className="p-2 space-y-1">
            {externalResults.map((result) => (
              <button
                key={`${result.location}-${result.id}`}
                onClick={() => handleResultClick(result)}
                className="w-full p-3 rounded-lg hover:bg-accent/50 transition-colors text-right flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{result.name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {result.email} · {result.phone}
                  </p>
                </div>
                <div className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium shrink-0",
                  getLocationColor(result.location)
                )}>
                  {getLocationIcon(result.location)}
                  <span>{result.locationLabel}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
