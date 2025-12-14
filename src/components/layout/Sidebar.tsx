import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, UserPlus, GraduationCap, Settings, History, ChevronDown, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const navigation = [
  { name: 'דשבורד', href: '/', icon: LayoutDashboard },
  { name: 'לידים', href: '/leads', icon: UserPlus },
  { name: 'סטודנטים', href: '/students', icon: GraduationCap },
  { name: 'יועצים', href: '/advisors', icon: UserCircle },
];

const pastClientsYears = ['2026', '2025', '2024', '2023', '2022'];

export function Sidebar() {
  const location = useLocation();
  const [isPastClientsOpen, setIsPastClientsOpen] = useState(
    location.pathname.startsWith('/past-clients')
  );

  const isPastClientsActive = location.pathname.startsWith('/past-clients');

  return (
    <aside className="fixed right-0 top-0 z-40 h-screen w-64 bg-sidebar border-l border-sidebar-border">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-20 items-center justify-center border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary">
              <GraduationCap className="h-6 w-6 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-sidebar-foreground">נוגה</h1>
              <p className="text-xs text-sidebar-foreground/60">לימודים בחו״ל</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}

          {/* Past Clients Collapsible */}
          <Collapsible open={isPastClientsOpen} onOpenChange={setIsPastClientsOpen}>
            <CollapsibleTrigger className={cn(
              'flex w-full items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200',
              isPastClientsActive
                ? 'bg-sidebar-accent text-sidebar-primary'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
            )}>
              <div className="flex items-center gap-3">
                <History className="h-5 w-5" />
                לקוחות עבר
              </div>
              <ChevronDown className={cn(
                'h-4 w-4 transition-transform duration-200',
                isPastClientsOpen && 'rotate-180'
              )} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pr-4 space-y-1 mt-1">
              {pastClientsYears.map((year) => {
                const isYearActive = location.pathname === `/past-clients/${year}`;
                return (
                  <Link
                    key={year}
                    to={`/past-clients/${year}`}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                      isYearActive
                        ? 'bg-sidebar-accent text-sidebar-primary'
                        : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                    )}
                  >
                    לקוחות עבר {year}
                  </Link>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          <Link
            to="/settings"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-sidebar-foreground/70 transition-all duration-200 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          >
            <Settings className="h-5 w-5" />
            הגדרות
          </Link>
        </div>
      </div>
    </aside>
  );
}
