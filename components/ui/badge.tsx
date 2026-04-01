import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants: Record<string, string> = {
    default: 'bg-[#f0b90b]/10 text-[#f0b90b] border-[#f0b90b]/30',
    secondary: 'bg-[#1a1f37] text-gray-300 border-[#2a2f47]',
    destructive: 'bg-red-500/10 text-red-400 border-red-500/30',
    outline: 'border border-[#2a2f47] text-gray-300',
    success: 'bg-green-500/10 text-green-400 border-green-500/30',
    warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  };
  return (
    <div
      className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold', variants[variant], className)}
      {...props}
    />
  );
}

export { Badge };
