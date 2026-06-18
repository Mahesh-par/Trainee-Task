type DayProgressBarProps = {
  completed: number;
  total?: number;
};

export function DayProgressBar({ completed, total = 15 }: DayProgressBarProps) {
  const safeTotal = Math.max(total, 1);
  const safeCompleted = Math.min(Math.max(completed, 0), safeTotal);
  const percentage = Math.round((safeCompleted / safeTotal) * 100);

  return (
    <div className="min-w-40">
      <div className="mb-1 flex items-center justify-between text-xs font-semibold text-gray-500">
        <span>{safeCompleted}</span>
        <span>{safeTotal}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-200">
        <div className="h-2 rounded-full bg-navy-800" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
