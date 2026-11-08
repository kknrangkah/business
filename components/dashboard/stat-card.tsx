import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DashboardStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  colorTheme?: 'emerald' | 'teal' | 'amber' | 'blue' | 'sky' | 'purple';
}

export function DashboardStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorTheme = 'emerald',
}: DashboardStatCardProps) {
  const themeStyles = {
    emerald: {
      iconBg: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
      accent: 'border-l-4 border-l-emerald-600',
    },
    teal: {
      iconBg: 'bg-teal-100 text-teal-900 border border-teal-300',
      accent: 'border-l-4 border-l-teal-600',
    },
    amber: {
      iconBg: 'bg-amber-100 text-amber-900 border border-amber-300',
      accent: 'border-l-4 border-l-amber-500',
    },
    blue: {
      iconBg: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
      accent: 'border-l-4 border-l-emerald-600',
    },
    sky: {
      iconBg: 'bg-teal-100 text-teal-900 border border-teal-300',
      accent: 'border-l-4 border-l-teal-600',
    },
    purple: {
      iconBg: 'bg-purple-100 text-purple-900 border border-purple-300',
      accent: 'border-l-4 border-l-purple-600',
    },
  };

  const style = themeStyles[colorTheme] || themeStyles.emerald;

  return (
    <Card className={cn('p-5 bg-white border border-slate-200 shadow-2xs relative overflow-hidden rounded-2xl', style.accent)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-600">{title}</p>
          <div className="text-3xl font-black tracking-tight text-slate-900">{value}</div>
          {subtitle && <p className="text-xs text-slate-700 font-semibold leading-relaxed">{subtitle}</p>}
        </div>
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl shadow-2xs shrink-0', style.iconBg)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-3.5 flex items-center gap-1.5 text-xs pt-2 border-t border-slate-100">
          <span
            className={cn(
              'font-extrabold',
              trend.isPositive ? 'text-emerald-700' : 'text-slate-600'
            )}
          >
            {trend.value}
          </span>
          <span className="text-slate-600 font-medium">dibanding kemarin</span>
        </div>
      )}
    </Card>
  );
}
