import { Step } from '../types';

export const goalsStep: Step = {
  title: 'Activities & Experiences',
  description: 'Tell us about your extracurricular activities, volunteering, and personal projects.',
  questions: [
    {
      id: 'extracurricular_activities',
      question: 'What extracurricular activities are you involved in? (clubs, sports, arts, etc.)',
      type: 'text',
      placeholder:
        'e.g., Debate club captain, varsity soccer, school newspaper editor, robotics team...',
      maxLength: 500,
      validation: (value: string) => (value ? null : 'Please share at least one activity'),
    },
    {
      id: 'volunteering',
      question: 'Do you have any volunteering experience?',
      type: 'conditional',
      options: ['Yes', 'No'],
      followUp: {
        condition: 'Yes',
        type: 'text',
        placeholder:
          'Describe your volunteering activities — where, what you did, and what you learned',
        maxLength: 500,
      },
    },
    {
      id: 'personal_initiative',
      question:
        'Have you started any personal project or initiative? (a blog, app, community group, small business, etc.)',
      type: 'conditional',
      options: ['Yes', 'No'],
      followUp: {
        condition: 'Yes',
        type: 'text',
        placeholder: 'Tell us about your project — what inspired it and what impact it had',
        maxLength: 500,
      },
    },
    {
      id: 'long_term_goals',
      question: "Now let's think long term and dream big — what are your goals after completing this program?",
      type: 'text',
      placeholder: 'Think about both short-term and long-term goals — what do you want to achieve?',
      maxLength: 500,
      validation: (value: string) => (value ? null : 'Please share your goals after completing the program'),
    },
  ],
};
