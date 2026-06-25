import { Step } from '../types';

export const basicInformationStep: Step = {
  title: 'Basic Information',
  description: "Let's get to know you better!",
  questions: [
    {
      id: 'basic_info',
      question: 'Tell us about yourself',
      type: 'combined_cards',
      subQuestions: [
        {
          id: 'age_range',
          question: 'What grade are you in?',
          type: 'age_cards',
          options: [
            { range: '10th Grade', icon: 'graduate' },
            { range: '11th Grade', icon: 'professional' },
            { range: '12th Grade', icon: 'experienced' },
            { range: 'Post High School', icon: 'senior' },
          ],
        },
        {
          id: 'gender',
          question: 'What is your gender?',
          type: 'gender_cards',
          options: [
            { value: 'Male', icon: 'user' },
            { value: 'Female', icon: 'user' },
            { value: 'Other', icon: 'user' },
          ],
        },
      ],
    },
    {
      id: 'degree_type',
      question: 'What type of degree are you pursuing or planning to pursue?',
      type: 'select',
      options: [
        'Undergraduate',
        'Postgraduate',
        'MBA',
        'PhD/Doctorate',
        'JD (Law)',
        'MD (Medicine)',
        'Other Professional Degree',
      ],
    },
  ],
};
