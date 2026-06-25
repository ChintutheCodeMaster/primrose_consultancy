import { Step } from '../types';

export const strengthsStep: Step = {
  title: 'Choose Your Superpowers',
  description:
    'These qualities will help shape a personal statement that highlights what makes you unique.',
  questions: [
    {
      id: 'qualities',
      question: 'What makes you stand out? Choose your superpowers! (Select up to 3)',
      type: 'multiple',
      maxChoices: 3,
      options: [
        'Determination',
        'Creativity',
        'Leadership',
        'Curiosity',
        'Empathy',
        'Problem-solving',
        'Innovation',
        'Adaptability',
        'Critical thinking',
        'Communication',
        'Strategic vision',
        'Teamwork',
      ],
      followUp: {
        type: 'text',
        placeholder: 'Tell us more about how you demonstrate these qualities...',
        maxLength: 200,
      },
    },
  ],
};
