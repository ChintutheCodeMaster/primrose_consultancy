import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="min-h-screen p-4 pt-16 lg:pt-8 lg:pr-64 lg:pl-4 lg:p-8">
        {children}
      </main>
    </div>
  );
}
