import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { scholarships, buildScholarshipPromptList, type Scholarship } from "@/data/scholarships";

export interface StudentProfile {
  citizenship: string;
  studyCountry: string;
  degreeType: string;
  fieldOfStudy: string;
  gpaRange: string;
  backgroundTags: string[];
}

export interface MatchResult {
  scholarshipId: string;
  matchLevel: 'high' | 'possible' | 'reach';
  matchScore: number;
  matchReason: string;
  personalizedTips: string[];
}

export interface EnrichedMatch extends MatchResult {
  scholarship: Scholarship;
}

type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; matches: EnrichedMatch[] }
  | { status: 'error'; message: string };

const DEFAULT_PROFILE: StudentProfile = {
  citizenship: '',
  studyCountry: '',
  degreeType: '',
  fieldOfStudy: '',
  gpaRange: '',
  backgroundTags: [],
};

export const STUDY_COUNTRIES = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'Japan',
  'China',
  'Sweden',
  'Switzerland',
  'Ireland',
  'New Zealand',
  'Europe (other)',
  'Any country',
];

export const DEGREE_TYPES = [
  { value: 'undergraduate', label: 'Undergraduate' },
  { value: 'masters', label: "Master's" },
  { value: 'mba', label: 'MBA' },
  { value: 'phd', label: 'PhD / Doctorate' },
];

export const FIELDS_OF_STUDY = [
  'STEM/Engineering',
  'Computer Science',
  'Natural Sciences',
  'Mathematics',
  'Medicine/Public Health',
  'Business/Economics',
  'Public Policy',
  'Social Sciences',
  'Arts & Humanities',
  'Law',
  'Education',
  'Any field',
];

export const GPA_RANGES = [
  { value: '3.7-4.0', label: '3.7 – 4.0 (top tier)' },
  { value: '3.5-3.69', label: '3.5 – 3.69 (strong)' },
  { value: '3.0-3.49', label: '3.0 – 3.49 (good)' },
  { value: 'below-3.0', label: 'Below 3.0' },
];

export const BACKGROUND_TAGS = [
  { value: 'leadership', label: 'Leadership' },
  { value: 'research', label: 'Research experience' },
  { value: 'volunteering', label: 'Volunteering / Service' },
  { value: 'financial-need', label: 'Financial need' },
  { value: 'first-gen', label: 'First-generation student' },
  { value: 'minority', label: 'Underrepresented minority' },
  { value: 'military', label: 'Military / Veteran' },
  { value: 'entrepreneurship', label: 'Entrepreneurship' },
  { value: 'arts', label: 'Arts / Creative' },
  { value: 'public-service', label: 'Public service commitment' },
];

export const useScholarshipFinder = () => {
  const [profile, setProfile] = useState<StudentProfile>(DEFAULT_PROFILE);
  const [searchState, setSearchState] = useState<SearchState>({ status: 'idle' });
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [selectedMatch, setSelectedMatch] = useState<EnrichedMatch | null>(null);

  const updateProfile = (updates: Partial<StudentProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const toggleBackgroundTag = (tag: string) => {
    setProfile(prev => ({
      ...prev,
      backgroundTags: prev.backgroundTags.includes(tag)
        ? prev.backgroundTags.filter(t => t !== tag)
        : [...prev.backgroundTags, tag],
    }));
  };

  const toggleSaved = (id: string) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const findMatches = async () => {
    if (!profile.citizenship || !profile.studyCountry || !profile.degreeType || !profile.fieldOfStudy || !profile.gpaRange) {
      return;
    }

    setSearchState({ status: 'loading' });
    setSelectedMatch(null);

    try {
      const scholarshipList = buildScholarshipPromptList();
      const { data, error } = await supabase.functions.invoke('scholarship-match', {
        body: { profile, scholarshipList },
      });

      if (error || !data?.matches) {
        setSearchState({ status: 'error', message: 'Could not find matches. Please try again.' });
        return;
      }

      const enriched: EnrichedMatch[] = (data.matches as MatchResult[])
        .map(match => {
          const scholarship = scholarships.find(s => s.id === match.scholarshipId);
          if (!scholarship) return null;
          return { ...match, scholarship };
        })
        .filter((m): m is EnrichedMatch => m !== null)
        .sort((a, b) => b.matchScore - a.matchScore);

      setSearchState({ status: 'success', matches: enriched });
    } catch {
      setSearchState({ status: 'error', message: 'Something went wrong. Please try again.' });
    }
  };

  const reset = () => {
    setProfile(DEFAULT_PROFILE);
    setSearchState({ status: 'idle' });
    setSelectedMatch(null);
  };

  const isProfileComplete =
    !!profile.citizenship &&
    !!profile.studyCountry &&
    !!profile.degreeType &&
    !!profile.fieldOfStudy &&
    !!profile.gpaRange;

  return {
    profile,
    searchState,
    savedIds,
    selectedMatch,
    isProfileComplete,
    updateProfile,
    toggleBackgroundTag,
    toggleSaved,
    setSelectedMatch,
    findMatches,
    reset,
  };
};
