import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
  className?: string;
}

export function StatCard({ title, value, icon: Icon, trend, description, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-card-foreground">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {trend && (
            <p
              className={cn(
                'text-sm font-medium',
                trend.isPositive ? 'text-success' : 'text-destructive'
              )}
            >
              {trend.isPositive ? '+' : ''}{trend.value}% from last month
            </p>
          )}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:bg-accent group-hover:text-accent-foreground">
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div className="absolute -left-4 -bottom-4 h-24 w-24 rounded-full bg-accent/5 transition-all duration-500 group-hover:scale-150 group-hover:bg-accent/10" />
    </div>
  );
}
