import { Reply } from "lucide-react";

import type { DaySubmission } from "../types";

type TraineeReplyDisplayProps = {
  submission: DaySubmission;
  isUnread?: boolean;
};

export function TraineeReplyDisplay({ submission, isUnread = false }: TraineeReplyDisplayProps) {
  if (!submission.traineeReply?.trim()) {
    return null;
  }

  return (
    <div
      className={`mt-4 rounded-lg border p-4 ${
        isUnread ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-200" : "border-emerald-200 bg-emerald-50"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Reply className="h-4 w-4 text-emerald-900" />
        <h6 className="text-sm font-extrabold uppercase tracking-wide text-emerald-900">
          Trainee Reply
        </h6>
        {isUnread && (
          <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-extrabold text-white">
            NEW
          </span>
        )}
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-emerald-950">
        {submission.traineeReply}
      </p>

      {submission.traineeRepliedAt && (
        <p className="mt-2 text-xs font-semibold text-emerald-800/80">
          Replied {new Date(submission.traineeRepliedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
