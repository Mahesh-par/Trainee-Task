import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { fetchTraineeSubmissions, markTraineeRepliesAsRead } from "../lib/api";
import type { DaySubmission, Trainee } from "../types";
import { AttachmentPreview } from "./AttachmentPreview";
import { DayProgressBar } from "./DayProgressBar";
import { SubmissionAdminReview } from "./SubmissionAdminReview";
import { SubmissionReviewStatusBadge } from "./SubmissionReviewStatusBadge";
import { TrainingStatusBadge } from "./TrainingStatusBadge";

type TraineeDetailModalProps = {
  trainee: Trainee | null;
  onClose: () => void;
  onRepliesRead?: () => void;
};

export function TraineeDetailModal({ trainee, onClose, onRepliesRead }: TraineeDetailModalProps) {
  const [submissions, setSubmissions] = useState<DaySubmission[]>([]);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!trainee) {
      setSubmissions([]);
      setExpandedDays(new Set());
      return;
    }

    const loadSubmissions = async () => {
      setIsLoading(true);
      setError("");

      try {
        const data = await fetchTraineeSubmissions(trainee.id);
        setSubmissions(data);

        const latestDay = data.reduce(
          (highest, submission) => Math.max(highest, submission.dayNumber),
          0
        );
        setExpandedDays(latestDay > 0 ? new Set([latestDay]) : new Set());
      } catch (requestError) {
        setError(
          requestError instanceof Error ? requestError.message : "Failed to load submissions"
        );
      } finally {
        setIsLoading(false);
      }
    };

    const loadAndMarkRead = async () => {
      await loadSubmissions();

      try {
        await markTraineeRepliesAsRead(trainee.id);
        setSubmissions((current) =>
          current.map((submission) => ({ ...submission, adminReplyRead: true }))
        );
        onRepliesRead?.();
      } catch {
        // Ignore mark-read errors so the modal still opens.
      }
    };

    void loadAndMarkRead();
  }, [trainee]);

  const sortedSubmissions = useMemo(
    () => [...submissions].sort((left, right) => left.dayNumber - right.dayNumber),
    [submissions]
  );

  if (!trainee) {
    return null;
  }

  const currentDay = Math.max(1, trainee.daysCompleted ?? 0);

  const handleSubmissionUpdated = (updatedSubmission: DaySubmission) => {
    setSubmissions((currentSubmissions) =>
      currentSubmissions.map((submission) =>
        submission.id === updatedSubmission.id ? updatedSubmission : submission
      )
    );
  };

  const toggleDay = (dayNumber: number) => {
    setExpandedDays((current) => {
      const next = new Set(current);

      if (next.has(dayNumber)) {
        next.delete(dayNumber);
      } else {
        next.add(dayNumber);
      }

      return next;
    });
  };

  const getSubmissionSummary = (submission: DaySubmission) => {
    const parts: string[] = [];

    if (submission.content.trim()) {
      parts.push("Text");
    }

    if (submission.attachments.length > 0) {
      parts.push(
        `${submission.attachments.length} file${submission.attachments.length === 1 ? "" : "s"}`
      );
    }

    if (submission.messages.length > 0) {
      parts.push(`${submission.messages.length} message${submission.messages.length === 1 ? "" : "s"}`);
    }

    return parts.length > 0 ? parts.join(" · ") : "No content yet";
  };

  const hasUnreadReply = (submission: DaySubmission) => {
    const lastMessage = submission.messages[submission.messages.length - 1];
    return lastMessage?.role === "trainee" && !submission.adminReplyRead;
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-950/50 px-4 py-6">
      <section className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-lg bg-white shadow-soft">
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <h3 className="text-xl font-extrabold text-gray-950">{trainee.name}</h3>
            <p className="mt-1 text-sm text-gray-500">{trainee.email}</p>
            <p className="mt-1 text-sm font-semibold text-gray-600">
              Joining Date: {trainee.joiningDate}
            </p>
            <div className="mt-2">
              <TrainingStatusBadge status={trainee.status ?? "not_started"} />
            </div>
          </div>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
            onClick={onClose}
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <section className="rounded-lg border border-gray-200 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-extrabold text-gray-950">Training Progress</p>
              <p className="text-sm font-semibold text-gray-600">
                Day {currentDay} · {submissions.length} submission
                {submissions.length === 1 ? "" : "s"}
              </p>
            </div>
            <DayProgressBar completed={trainee.daysCompleted ?? 0} />
          </section>

          <section>
            <h4 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-gray-500">
              Saved Daily Submissions
            </h4>

            {error && (
              <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                {error}
              </p>
            )}

            {isLoading ? (
              <p className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm font-semibold text-gray-600">
                Loading trainee submissions...
              </p>
            ) : submissions.length === 0 ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
                This trainee has not submitted any daily work yet.
              </p>
            ) : (
              <div className="space-y-2">
                {sortedSubmissions.map((submission) => {
                  const isExpanded = expandedDays.has(submission.dayNumber);
                  const unread = hasUnreadReply(submission);

                  return (
                    <article
                      key={submission.id}
                      className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-soft"
                    >
                      <button
                        type="button"
                        onClick={() => toggleDay(submission.dayNumber)}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-gray-50 ${
                          isExpanded ? "border-b border-gray-100 bg-gray-50" : ""
                        }`}
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h5 className="text-base font-extrabold text-gray-950">
                              Day {submission.dayNumber}
                            </h5>
                            {submission.reviewStatus && (
                              <SubmissionReviewStatusBadge status={submission.reviewStatus} />
                            )}
                            {unread && (
                              <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-extrabold text-white">
                                NEW REPLY
                              </span>
                            )}
                          </div>
                          {!isExpanded && (
                            <p className="mt-1 truncate text-xs text-gray-500">
                              {getSubmissionSummary(submission)}
                            </p>
                          )}
                        </div>

                        {submission.updatedAt && (
                          <p className="shrink-0 text-xs font-semibold text-gray-500">
                            {isExpanded
                              ? `Updated ${new Date(submission.updatedAt).toLocaleString()}`
                              : new Date(submission.updatedAt).toLocaleDateString()}
                          </p>
                        )}
                      </button>

                      {isExpanded && (
                        <div className="space-y-4 p-4">
                          {submission.content ? (
                            <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-md border border-gray-200 bg-gray-50 p-3 font-mono text-xs leading-6 text-gray-800">
                              {submission.content}
                            </pre>
                          ) : (
                            <p className="text-sm text-gray-500">No pasted text for this day.</p>
                          )}

                          {submission.attachments.length > 0 && (
                            <div className="space-y-3">
                              {submission.attachments.map((attachment) => (
                                <AttachmentPreview
                                  key={attachment.id}
                                  url={attachment.url}
                                  name={attachment.originalName}
                                  mimeType={attachment.mimeType}
                                  size={attachment.size}
                                />
                              ))}
                            </div>
                          )}

                          <SubmissionAdminReview
                            submission={submission}
                            onUpdated={handleSubmissionUpdated}
                          />
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
