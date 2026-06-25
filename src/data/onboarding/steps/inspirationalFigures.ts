import { Step } from '../types';

const figures = [
  'Steve Jobs',
  'Oprah Winfrey',
  'Malala Yousafzai',
  'Ruth Bader Ginsburg',
  'Serena Williams',
  'Albert Einstein',
  'Marie Curie',
  'Magic Johnson',
  'Taylor Swift',
  'Simone Biles',
  'Mark Zuckerberg',
  'Frida Kahlo',
  'Michelle Obama',
  'Other',
];

export const inspirationalFiguresStep: Step = {
  title: 'Whose journey, achievements, and values inspire you the most?',
  description:
    'Choose figures whose success, leadership, or resilience motivate you in your academic and career journey. Your choices help us better understand your aspirations.',
  questions: [
    {
      id: 'inspirational_figures',
      question: 'Select up to three figures who inspire you:',
      type: 'multiple',
      options: figures,
      maxChoices: 3,
      followUp: {
        type: 'text',
        placeholder: 'What about these figures resonates with you the most?',
        maxLength: 300,
      },
    },
  ],
};
