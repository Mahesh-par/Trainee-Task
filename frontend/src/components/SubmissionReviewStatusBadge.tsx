import type { SubmissionReviewStatus } from "../types";

const statusStyles: Record<
  SubmissionReviewStatus,
  { label: string; className: string }
> = {
  done: {
    label: "DONE",
    className: "border-emerald-300 bg-emerald-50 text-emerald-900"
  },
  need_improvement: {
    label: "NEED IMPROVEMENT",
    className: "border-amber-300 bg-amber-50 text-amber-900"
  },
  cancel: {
    label: "CANCEL",
    className: "border-red-300 bg-red-50 text-red-900"
  }
};

type SubmissionReviewStatusBadgeProps = {
  status: SubmissionReviewStatus;
};

export function SubmissionReviewStatusBadge({ status }: SubmissionReviewStatusBadgeProps) {
  const config = statusStyles[status];

  return (
    <span
      className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-extrabold uppercase tracking-wide ${config.className}`}
    >
      {config.label}
    </span>
  );
}
