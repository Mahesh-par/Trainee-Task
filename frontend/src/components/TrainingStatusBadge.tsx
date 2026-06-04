import type { TrainingStatus } from "../types";

const statusStyles: Record<TrainingStatus, string> = {
  active: "border-blue-200 bg-blue-50 text-blue-800",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  not_started: "border-gray-200 bg-gray-100 text-gray-700"
};

const statusLabels: Record<TrainingStatus, string> = {
  active: "Active",
  completed: "Completed",
  not_started: "Not Started"
};

type TrainingStatusBadgeProps = {
  status: TrainingStatus;
};

export function TrainingStatusBadge({ status }: TrainingStatusBadgeProps) {
  return (
    <span
      className={`inline-flex min-w-24 items-center justify-center rounded-md border px-2.5 py-1 text-xs font-bold ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
