import { Step } from '../types';

export const personalStoryStep: Step = {
  title: 'Your Personal Story',
  description:
    'A great personal statement includes your unique journey. Share with us a personal story that defines you.',
  questions: [
    {
      id: 'challenge',
      question: 'Share a personal story that defines you',
      type: 'text',
      placeholder:
        "It could be something from long ago or more recent, from a professional/academic perspective or a personal one. We want to get to know you!",
      maxLength: 500,
    },
  ],
};
