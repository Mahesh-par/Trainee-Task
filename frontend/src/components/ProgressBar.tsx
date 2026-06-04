type ProgressBarProps = {
  value: number;
  label?: string;
};

export function ProgressBar({ value, label = "Overall Completion" }: ProgressBarProps) {
  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold text-gray-900">{label}</span>
        <span className="font-semibold text-navy-800">{value}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-gray-200">
        <div
          className="h-2.5 rounded-full bg-navy-800 transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
