import { User, Clock } from 'lucide-react';

export interface AuditTrailStep {
  step?: number;
  title: string;
  timestamp: string;
  actor: string;
  details: string;
  status?: 'COMPLETED' | 'PENDING' | 'FLAGGED' | string;
  evidence_tag?: string;
}

interface AuditTrailProps {
  steps: AuditTrailStep[];
  title?: string;
  className?: string;
}

export default function AuditTrail({
  steps,
  title = "Immutable Governance Audit Trail",
  className = "",
}: AuditTrailProps) {
  return (
    <div className={`ftm-card p-6 space-y-6 ${className}`}>
      <div className="flex items-center justify-between border-b border-[#232E42] pb-4">
        <div>
          <h3 className="text-sm font-display font-bold text-[#E9EDF4] uppercase tracking-wider">
            {title}
          </h3>
          <p className="text-xs text-[#8C99AF] mt-0.5">
            Cryptographic ledger tracking causal telemetry and executive actions
          </p>
        </div>
        <span className="text-[10px] font-mono bg-[#3ADDA0]/10 text-[#3ADDA0] border border-[#3ADDA0]/30 px-2.5 py-1 rounded-full font-bold">
          Verified Integrity
        </span>
      </div>

      {/* Vertical Connected-Dot List */}
      <div className="relative pl-6 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-[#E8A33D] before:via-[#5B8DEF] before:to-[#3ADDA0]">
        {steps.map((step, idx) => (
          <div key={idx} className="relative group">
            {/* Connected Dot */}
            <div className="absolute -left-[29px] top-1 w-5 h-5 rounded-full bg-[#121826] border-2 border-[#E8A33D] flex items-center justify-center shadow-[0_0_8px_rgba(232,163,61,0.5)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E8A33D]" />
            </div>

            {/* Step Card Content */}
            <div className="ftm-card-nested p-4 space-y-2 border border-[#232E42] hover:border-[#5B8DEF]/40 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold bg-[#0B0F17] text-[#5B8DEF] px-2 py-0.5 rounded border border-[#232E42]">
                    Step 0{step.step || idx + 1}
                  </span>
                  <h4 className="text-xs font-display font-bold text-[#E9EDF4]">
                    {step.title}
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-[#5B6A82] flex items-center gap-1">
                  <Clock size={12} /> {step.timestamp}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#8C99AF]">
                <User size={13} className="text-[#E8A33D]" />
                <span className="font-medium text-[#E9EDF4]">{step.actor}</span>
              </div>

              <p className="text-xs text-[#8C99AF] leading-relaxed font-sans">
                {step.details}
              </p>

              {step.evidence_tag && (
                <div className="pt-1">
                  <span className="text-[10px] font-mono bg-[#0B0F17] text-[#8C99AF] px-2 py-0.5 rounded border border-[#232E42]">
                    Evidence: {step.evidence_tag}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
