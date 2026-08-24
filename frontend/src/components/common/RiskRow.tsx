import { ChevronRight } from 'lucide-react';

export interface RiskRowProps {
  id?: string;
  category: string;
  level: 'HIGH' | 'MEDIUM' | 'LOW' | string;
  score?: number;
  impact_formatted: string;
  probability?: number;
  trend?: string;
  description?: string;
  onClick?: () => void;
}

export default function RiskRow({
  id,
  category,
  level,
  impact_formatted,
  probability,
  description,
  onClick,
}: RiskRowProps) {
  const dotColor =
    level === 'HIGH'
      ? 'bg-[#F1584F] shadow-[0_0_8px_rgba(241,88,79,0.6)]'
      : level === 'MEDIUM'
      ? 'bg-[#E8A33D] shadow-[0_0_8px_rgba(232,163,61,0.6)]'
      : 'bg-[#3ADDA0] shadow-[0_0_8px_rgba(58,221,160,0.6)]';

  const textColor =
    level === 'HIGH'
      ? 'text-[#F1584F]'
      : level === 'MEDIUM'
      ? 'text-[#E8A33D]'
      : 'text-[#3ADDA0]';

  return (
    <div
      onClick={onClick}
      className={`ftm-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#2F3D57] transition-all ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Severity Dot */}
        <span className={`w-2.5 h-2.5 rounded-full ${dotColor} shrink-0`} />
        <div>
          <div className="flex items-center gap-2">
            {id && (
              <span className="text-[10px] font-mono text-[#5B6A82] bg-[#0B0F17] px-1.5 py-0.5 rounded border border-[#232E42]">
                {id}
              </span>
            )}
            <p className="text-sm font-semibold text-[#E9EDF4]">{category}</p>
          </div>
          {description && (
            <p className="text-xs text-[#8C99AF] mt-0.5 line-clamp-1 max-w-lg">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-5 text-right">
        <div>
          <span className="text-[10px] font-mono uppercase text-[#5B6A82] block">Est. Impact</span>
          <span className={`text-sm font-bold font-mono ${textColor}`}>
            {impact_formatted}
          </span>
        </div>
        {probability !== undefined && (
          <div>
            <span className="text-[10px] font-mono uppercase text-[#5B6A82] block">Probability</span>
            <span className="text-sm font-bold font-mono text-[#E9EDF4]">
              {probability}%
            </span>
          </div>
        )}
        {onClick && (
          <ChevronRight size={16} className="text-[#5B6A82] shrink-0" />
        )}
      </div>
    </div>
  );
}
