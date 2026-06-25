import { Step } from './types';
import { basicInformationStep } from './steps/basicInformation';
import { inspirationalFiguresStep } from './steps/inspirationalFigures';
import { personalStoryStep } from './steps/personalStory';
import { backgroundStep } from './steps/background';
import { goalsStep } from './steps/goals';
import { strengthsStep } from './steps/strengths';

export const steps: Step[] = [
  basicInformationStep,
  inspirationalFiguresStep,
  personalStoryStep,
  backgroundStep,
  goalsStep,
  strengthsStep,
];
