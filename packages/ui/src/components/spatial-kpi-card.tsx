import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './card';
import { Badge } from './badge';
import { cn } from '../index';

export interface SpatialKpiCardProps {
  title: string;
  value: string | number;
  description?: string;
  badge?: string;
  badgeVariant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'glass';
  trend?: 'up' | 'down' | 'neutral';
  change?: string;
  icon?: React.ReactNode;
  sparkline?: number[];
  material?: 'ambient' | 'frosted' | 'crystal' | 'dark' | 'solid';
  className?: string;
}

export function SpatialKpiCard({
  title,
  value,
  description,
  badge,
  badgeVariant = 'info',
  trend = 'neutral',
  change,
  icon,
  sparkline,
  material = 'frosted',
  className,
}: SpatialKpiCardProps) {
  // Render a minimal SVG sparkline trajectory
  const renderSparkline = () => {
    if (!sparkline || sparkline.length < 2) return null;
    const min = Math.min(...sparkline);
    const max = Math.max(...sparkline);
    const range = max - min || 1;
    const width = 100;
    const height = 28;

    const points = sparkline
      .map((val, idx) => {
        const x = (idx / (sparkline.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 6) - 3;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    const strokeColor =
      trend === 'up'
        ? 'rgba(52, 211, 153, 0.85)' // Emerald
        : trend === 'down'
        ? 'rgba(248, 113, 113, 0.85)' // Rose
        : 'rgba(56, 189, 248, 0.85)'; // Sky

    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-7 w-24 overflow-visible"
        aria-hidden="true"
      >
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  return (
    <Card material={material} interactive className={cn('relative', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center space-x-2">
          {icon && <span className="text-slate-400">{icon}</span>}
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {title}
          </CardTitle>
        </div>
        {badge && (
          <Badge variant={badgeVariant} pulse={badgeVariant === 'success'}>
            {badge}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between mt-1">
          <div className="text-3xl font-bold tracking-tight text-white font-mono">{value}</div>
          {renderSparkline()}
        </div>

        <div className="mt-2 flex items-center justify-between text-xs">
          {description && <p className="text-slate-400 truncate">{description}</p>}
          {change && (
            <span
              className={cn(
                'font-medium ml-auto flex items-center gap-0.5',
                trend === 'up' && 'text-emerald-400',
                trend === 'down' && 'text-rose-400',
                trend === 'neutral' && 'text-slate-400'
              )}
            >
              {trend === 'up' && '↑'}
              {trend === 'down' && '↓'}
              {change}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
