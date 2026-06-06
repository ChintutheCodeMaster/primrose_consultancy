// Derives UI terminology based on the student's degree level so the journey
// portal works for undergrad (bachelor), graduate (master/PhD/MBA), and other
// program types — not just college applicants.

export type ProgramTerms = {
  level: 'undergrad' | 'grad' | 'other';
  /** Singular noun, lowercase: "college" / "program" */
  noun: string;
  /** Plural noun, lowercase: "colleges" / "programs" */
  nounPlural: string;
  /** Capitalized singular for buttons/titles */
  Noun: string;
  /** Capitalized plural for nav/headings */
  NounPlural: string;
  /** Section title — e.g. "My Colleges" / "My Programs" */
  sectionTitle: string;
  /** Short label for nav items */
  navLabel: string;
  /** Add button label */
  addLabel: string;
  /** Placeholder for the school/program name input */
  namePlaceholder: string;
  /** Subtitle for the list page */
  listSubtitle: string;
  /** Phase label override for "Building your list" */
  listPhaseLabel: string;
  /** Stage label inside the admissions progress tracker */
  listStageLabel: string;
  /** Heading for the standardized-test section in onboarding */
  testSectionTitle: string;
  /** Subtitle for the academics step in onboarding */
  academicsSubtitle: string;
  /** Labels + placeholders for the two standardized-test inputs */
  test1: { label: string; placeholder: string };
  test2: { label: string; placeholder: string };
  /** Whether to show the "Class rank" field (undergrad-only) */
  showClassRank: boolean;
};

export function getProgramTerms(degreeType?: string | null): ProgramTerms {
  const t = (degreeType || '').toLowerCase();

  // Undergrad — keep the existing college-centric language
  if (t === '' || t === 'bachelor' || t === 'bachelors' || t === 'undergrad' || t === 'undergraduate') {
    return {
      level: 'undergrad',
      noun: 'college',
      nounPlural: 'colleges',
      Noun: 'College',
      NounPlural: 'Colleges',
      sectionTitle: 'My Colleges',
      navLabel: 'My Colleges',
      addLabel: 'Add college',
      namePlaceholder: 'e.g. Brown University',
      listSubtitle:
        "Your working list, organized by reach. Add schools you're considering — your consultant will see them too.",
      listPhaseLabel: 'Building your list',
      listStageLabel: 'College list',
      testSectionTitle: 'Academics',
      academicsSubtitle: 'Numbers help us right-size your college list.',
      test1: { label: 'SAT score', placeholder: '1450' },
      test2: { label: 'ACT score', placeholder: '32' },
      showClassRank: true,
    };
  }

  // MBA
  if (t === 'mba') {
    return {
      level: 'grad',
      noun: 'program',
      nounPlural: 'programs',
      Noun: 'Program',
      NounPlural: 'Programs',
      sectionTitle: 'My Programs',
      navLabel: 'My Programs',
      addLabel: 'Add program',
      namePlaceholder: 'e.g. Wharton MBA',
      listSubtitle:
        "Your working list of MBA programs, organized by reach. Add programs you're considering — your consultant will see them too.",
      listPhaseLabel: 'Building your program list',
      listStageLabel: 'Program list',
      testSectionTitle: 'Academics & test scores',
      academicsSubtitle: 'Numbers help us right-size your program list.',
      test1: { label: 'GMAT score', placeholder: '720' },
      test2: { label: 'GRE score', placeholder: '325' },
      showClassRank: false,
    };
  }

  // PhD / Doctorate
  if (t === 'phd' || t === 'doctorate') {
    return {
      level: 'grad',
      noun: 'program',
      nounPlural: 'programs',
      Noun: 'Program',
      NounPlural: 'Programs',
      sectionTitle: 'My Programs',
      navLabel: 'My Programs',
      addLabel: 'Add program',
      namePlaceholder: 'e.g. Stanford CS PhD',
      listSubtitle:
        "Your working list of PhD programs and advisors. Add programs you're considering — your consultant will see them too.",
      listPhaseLabel: 'Building your program list',
      listStageLabel: 'Program list',
      testSectionTitle: 'Academics & test scores',
      academicsSubtitle: 'Numbers help us right-size your program list.',
      test1: { label: 'GRE score', placeholder: '325' },
      test2: { label: 'Subject test / TOEFL', placeholder: 'Optional' },
      showClassRank: false,
    };
  }

  // Master's / generic graduate / other
  return {
    level: t === 'scholarship' ? 'other' : 'grad',
    noun: 'program',
    nounPlural: 'programs',
    Noun: 'Program',
    NounPlural: 'Programs',
    sectionTitle: 'My Programs',
    navLabel: 'My Programs',
    addLabel: 'Add program',
    namePlaceholder: "e.g. Columbia Master's in Data Science",
    listSubtitle:
      "Your working list of programs, organized by reach. Add programs you're considering — your consultant will see them too.",
    listPhaseLabel: 'Building your program list',
    listStageLabel: 'Program list',
    testSectionTitle: 'Academics & test scores',
    academicsSubtitle: 'Numbers help us right-size your program list.',
    test1: { label: 'GRE score', placeholder: '325' },
    test2: { label: 'GMAT / TOEFL', placeholder: 'Optional' },
    showClassRank: false,
  };
}
