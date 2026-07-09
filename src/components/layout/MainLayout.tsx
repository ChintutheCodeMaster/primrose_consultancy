import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { BackButton } from './BackButton';
import { TrialBanner } from './TrialBanner';
import { TrialGate } from '@/components/pricing/TrialGate';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Sidebar />
      <TrialBanner />
      <main className="min-h-screen p-3 pt-16 sm:p-4 sm:pt-16 lg:pt-8 lg:pl-72 lg:pr-8 min-w-0">
        <BackButton />
        {children}
      </main>
      <TrialGate />
    </div>
  );
}
