import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  children: React.ReactNode;
  variant?: string;
  className?: string;
}

export function StatusBadge({ children, variant, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
        variant,
        className
      )}
    >
      {children}
    </span>
  );
}
