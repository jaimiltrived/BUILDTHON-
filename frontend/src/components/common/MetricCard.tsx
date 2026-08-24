import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  delta?: string;
  deltaType?: 'positive' | 'negative' | 'neutral';
  subtitle?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  loading?: boolean;
}

export default function MetricCard({
  title,
  value,
  delta,
  deltaType = 'positive',
  subtitle,
  icon: Icon,
  loading = false,
}: MetricCardProps) {
  // Digit count-up effect if numeric
  const [displayValue, setDisplayValue] = useState<string | number>(value);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  if (loading) {
    return (
      <div className="ftm-card p-5 space-y-3 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-3 w-24 bg-[#182234] rounded"></div>
          <div className="h-6 w-6 bg-[#182234] rounded-lg"></div>
        </div>
        <div className="h-8 w-32 bg-[#182234] rounded"></div>
        <div className="h-3 w-28 bg-[#182234] rounded"></div>
      </div>
    );
  }

  const deltaColor =
    deltaType === 'positive'
      ? 'text-[#3ADDA0]'
      : deltaType === 'negative'
      ? 'text-[#F1584F]'
      : 'text-[#5B8DEF]';

  const DeltaIcon =
    deltaType === 'positive'
      ? TrendingUp
      : deltaType === 'negative'
      ? TrendingDown
      : Minus;

  return (
    <div className="ftm-card p-5 space-y-2 hover:border-[#2F3D57] transition-all group">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase tracking-wider text-[#5B6A82] font-semibold">
          {title}
        </span>
        {Icon && (
          <div className="p-2 rounded-lg bg-[#182234] text-[#8C99AF] group-hover:text-[#E9EDF4] transition-colors">
            <Icon size={16} />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-bold font-mono tracking-tight text-[#E9EDF4]">
          {displayValue}
        </p>
      </div>

      <div className="flex items-center justify-between pt-1">
        {delta && (
          <p className={`text-xs font-mono font-medium flex items-center gap-1 ${deltaColor}`}>
            <DeltaIcon size={13} />
            <span>{delta}</span>
          </p>
        )}
        {subtitle && (
          <span className="text-[11px] text-[#5B6A82] truncate max-w-[65%] text-right font-medium">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
