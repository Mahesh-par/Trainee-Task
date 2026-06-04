type DayProgressBarProps = {
  completed: number;
  total?: number;
};

export function DayProgressBar({ completed, total = 15 }: DayProgressBarProps) {
  const percentage = Math.round((completed / total) * 100);

  return (
    <div className="min-w-40">
      <div className="mb-1 flex items-center justify-between text-xs font-semibold text-gray-500">
        <span>Day {completed}</span>
        <span>{total}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-200">
        <div className="h-2 rounded-full bg-navy-800" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
