
export function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${count} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="ftm-card p-5 space-y-3 animate-pulse">
          <div className="flex justify-between items-center">
            <div className="h-3 w-20 bg-[#182234] rounded"></div>
            <div className="h-5 w-5 bg-[#182234] rounded-lg"></div>
          </div>
          <div className="h-8 w-28 bg-[#182234] rounded"></div>
          <div className="h-3 w-24 bg-[#182234] rounded"></div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="ftm-card overflow-hidden divide-y divide-[#232E42] animate-pulse">
      <div className="p-4 bg-[#182234]/50 h-10"></div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 flex items-center justify-between gap-4">
          <div className="h-4 w-1/3 bg-[#182234] rounded"></div>
          <div className="h-4 w-20 bg-[#182234] rounded"></div>
          <div className="h-4 w-16 bg-[#182234] rounded"></div>
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="ftm-card p-6 h-[300px] flex flex-col justify-between animate-pulse">
      <div className="flex justify-between">
        <div className="h-4 w-48 bg-[#182234] rounded"></div>
        <div className="h-4 w-20 bg-[#182234] rounded"></div>
      </div>
      <div className="h-48 w-full bg-[#182234]/30 rounded-lg flex items-end gap-3 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-[#182234] rounded-t"
            style={{ height: `${30 + Math.random() * 60}%` }}
          ></div>
        ))}
      </div>
    </div>
  );
}
