import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, UserPlus, GraduationCap, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'דשבורד', href: '/', icon: LayoutDashboard },
  { name: 'לידים', href: '/leads', icon: UserPlus },
  { name: 'סטודנטים', href: '/students', icon: GraduationCap },
];

export function Sidebar() {
  const location = useLocation();

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
        <nav className="flex-1 space-y-1 p-4">
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
