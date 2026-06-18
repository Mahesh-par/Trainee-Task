import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  apiRequest,
  fetchTraineeSubmissions,
  mapCourseDay,
  markTraineeRepliesAsRead,
  updateTraineeRole
} from "../lib/api";
import {
  curriculumTrackLabels,
  curriculumTracks,
  DEFAULT_CURRICULUM_TRACK
} from "../lib/curriculumTracks";
import type { CurriculumTrack, DaySubmission, Trainee } from "../types";
import { AttachmentPreview } from "./AttachmentPreview";
import { DayProgressBar } from "./DayProgressBar";
import { SubmissionAdminReview } from "./SubmissionAdminReview";
import { SubmissionReviewStatusBadge } from "./SubmissionReviewStatusBadge";
import { TrainingStatusBadge } from "./TrainingStatusBadge";

type TraineeDetailModalProps = {
  trainee: Trainee | null;
  onClose: () => void;
  onRepliesRead?: () => void;
  onTraineeUpdated?: (trainee: Trainee) => void;
};

type CourseDaysResponse = {
  courseDays: Parameters<typeof mapCourseDay>[0][];
};

export function TraineeDetailModal({
  trainee,
  onClose,
  onRepliesRead,
  onTraineeUpdated
}: TraineeDetailModalProps) {
  const [submissions, setSubmissions] = useState<DaySubmission[]>([]);
  const [courseDayTitles, setCourseDayTitles] = useState<Record<number, string>>({});
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedTrack, setSelectedTrack] = useState<CurriculumTrack>(DEFAULT_CURRICULUM_TRACK);
  const [isUpdatingTrack, setIsUpdatingTrack] = useState(false);
  const [trackMessage, setTrackMessage] = useState("");

  useEffect(() => {
    if (!trainee) {
      setSubmissions([]);
      setCourseDayTitles({});
      setExpandedDays(new Set());
      return;
    }

    setSelectedTrack(trainee.traineeRole ?? DEFAULT_CURRICULUM_TRACK);
    setTrackMessage("");

    const loadSubmissions = async () => {
      setIsLoading(true);
      setError("");

      try {
        const data = await fetchTraineeSubmissions(trainee.id);
        setSubmissions(data);

        const track = trainee.traineeRole ?? DEFAULT_CURRICULUM_TRACK;
        const courseDaysData = await apiRequest<CourseDaysResponse>(
          `/course-days?track=${encodeURIComponent(track)}`
        );
        setCourseDayTitles(
          Object.fromEntries(
            courseDaysData.courseDays.map((courseDay) => {
              const mappedCourseDay = mapCourseDay(courseDay);
              return [mappedCourseDay.dayNumber, mappedCourseDay.title];
            })
          )
        );

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

  const completedTasks = trainee.daysCompleted ?? 0;
  const totalTasks = trainee.totalDays ?? 15;

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

  const getSubmissionHeading = (dayNumber: number) => {
    const title = courseDayTitles[dayNumber];

    return title ? `Day ${dayNumber}: ${title}` : `Day ${dayNumber}`;
  };

  const formatSubmissionDateTime = (dateValue?: string) =>
    dateValue
      ? new Date(dateValue).toLocaleString(undefined, {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        })
      : "";

  const handleTrackUpdate = async () => {
    if (!trainee || selectedTrack === trainee.traineeRole) {
      return;
    }

    setIsUpdatingTrack(true);
    setTrackMessage("");
    setError("");

    try {
      const updatedTrainee = await updateTraineeRole(trainee.id, selectedTrack);
      onTraineeUpdated?.(updatedTrainee);
      setTrackMessage(`Role updated to ${curriculumTrackLabels[selectedTrack]}.`);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Failed to update curriculum track"
      );
    } finally {
      setIsUpdatingTrack(false);
    }
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
            <div className="mt-4 flex flex-wrap items-end gap-2">
              <label className="text-xs font-bold text-gray-600">
                Role
                <select
                  value={selectedTrack}
                  onChange={(event) => setSelectedTrack(event.target.value as CurriculumTrack)}
                  className="mt-1 block min-w-[180px] rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  {curriculumTracks.map((track) => (
                    <option key={track} value={track}>
                      {curriculumTrackLabels[track]}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => void handleTrackUpdate()}
                disabled={isUpdatingTrack || selectedTrack === trainee.traineeRole}
                className="rounded-md bg-navy-900 px-3 py-2 text-xs font-bold text-white hover:bg-navy-800 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {isUpdatingTrack ? "Saving..." : "Update Role"}
              </button>
            </div>
            {trackMessage && (
              <p className="mt-2 text-xs font-semibold text-emerald-700">{trackMessage}</p>
            )}
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
                {completedTasks} / {totalTasks} tasks · {submissions.length} submission
                {submissions.length === 1 ? "" : "s"}
              </p>
            </div>
            <DayProgressBar completed={completedTasks} total={totalTasks} />
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
                              {getSubmissionHeading(submission.dayNumber)}
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
                              ? `Updated ${formatSubmissionDateTime(submission.updatedAt)}`
                              : formatSubmissionDateTime(submission.updatedAt)}
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
