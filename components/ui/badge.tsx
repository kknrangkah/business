import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-emerald-700 text-white shadow-2xs hover:bg-emerald-800 font-bold',
        secondary: 'border-emerald-200 bg-emerald-100/80 text-emerald-900 font-bold hover:bg-emerald-100',
        success: 'border-emerald-300 bg-emerald-100 text-emerald-900 font-bold',
        warning: 'border-amber-300 bg-amber-100 text-amber-900 font-bold',
        destructive: 'border-rose-300 bg-rose-100 text-rose-900 font-bold',
        info: 'border-teal-300 bg-teal-100 text-teal-900 font-bold',
        outline: 'border-slate-300 text-slate-800 bg-white font-bold',
        purple: 'border-purple-300 bg-purple-100 text-purple-900 font-bold',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
