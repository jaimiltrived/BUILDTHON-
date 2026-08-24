
export type StatusVariant = 'pending' | 'approved' | 'rejected' | 'modified' | 'awaiting_approval' | string;

interface StatusPillProps {
  status: StatusVariant;
  className?: string;
}

export default function StatusPill({ status, className = '' }: StatusPillProps) {
  const norm = status.toLowerCase().replace(/_/g, ' ');

  let style = 'bg-[#E8A33D]/10 text-[#E8A33D] border-[#E8A33D]/30'; // default amber pending

  if (norm.includes('approved') || norm.includes('active') || norm.includes('completed')) {
    style = 'bg-[#3ADDA0]/10 text-[#3ADDA0] border-[#3ADDA0]/30';
  } else if (norm.includes('rejected') || norm.includes('critical') || norm.includes('high')) {
    style = 'bg-[#F1584F]/10 text-[#F1584F] border-[#F1584F]/30';
  } else if (norm.includes('modified') || norm.includes('review') || norm.includes('base')) {
    style = 'bg-[#5B8DEF]/10 text-[#5B8DEF] border-[#5B8DEF]/30';
  } else if (norm.includes('awaiting') || norm.includes('pending')) {
    style = 'bg-[#E8A33D]/10 text-[#E8A33D] border-[#E8A33D]/30 animate-pulse';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${style} ${className}`}
    >
      {norm}
    </span>
  );
}
