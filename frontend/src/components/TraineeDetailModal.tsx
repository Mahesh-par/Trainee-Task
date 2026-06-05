import { X } from "lucide-react";
import { useEffect, useState } from "react";

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!trainee) {
      setSubmissions([]);
      return;
    }

    const loadSubmissions = async () => {
      setIsLoading(true);
      setError("");

      try {
        const data = await fetchTraineeSubmissions(trainee.id);
        setSubmissions(data);
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
              <p className="text-sm font-extrabold text-gray-950">15-Day Progress</p>
              <p className="text-sm font-semibold text-gray-600">
                Day {currentDay} / 15 · {submissions.length} submission
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
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <article
                    key={submission.id}
                    className="rounded-lg border border-gray-200 bg-white p-4 shadow-soft"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h5 className="text-base font-extrabold text-gray-950">
                          Day {submission.dayNumber}
                        </h5>
                        {submission.reviewStatus && (
                          <SubmissionReviewStatusBadge status={submission.reviewStatus} />
                        )}
                      </div>
                      {submission.updatedAt && (
                        <p className="text-xs font-semibold text-gray-500">
                          Updated {new Date(submission.updatedAt).toLocaleString()}
                        </p>
                      )}
                    </div>

                    {submission.content ? (
                      <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-md border border-gray-200 bg-gray-50 p-3 font-mono text-xs leading-6 text-gray-800">
                        {submission.content}
                      </pre>
                    ) : (
                      <p className="mt-3 text-sm text-gray-500">No pasted text for this day.</p>
                    )}

                    {submission.attachments.length > 0 && (
                      <div className="mt-3 space-y-3">
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
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
