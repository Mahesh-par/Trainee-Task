import { useState } from "react";

import { updateSubmissionReview } from "../lib/api";
import type { DaySubmission, SubmissionReviewStatus } from "../types";
import { SubmissionChat } from "./SubmissionChat";

type SubmissionAdminReviewProps = {
  submission: DaySubmission;
  onUpdated: (submission: DaySubmission) => void;
};

export function SubmissionAdminReview({ submission, onUpdated }: SubmissionAdminReviewProps) {
  const [reviewStatus, setReviewStatus] = useState<SubmissionReviewStatus | "">(
    submission.reviewStatus ?? ""
  );
  const [composeValue, setComposeValue] = useState("");
  const [error, setError] = useState("");
  const [notification, setNotification] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveReview = async () => {
    if (!reviewStatus) {
      setError("Please select a status before sending.");
      return;
    }

    if (!composeValue.trim()) {
      setError("Please write a message for the trainee.");
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      const updatedSubmission = await updateSubmissionReview({
        submissionId: submission.id,
        reviewStatus,
        adminComment: composeValue
      });
      onUpdated(updatedSubmission);
      setComposeValue("");
      setNotification(
        reviewStatus === "done"
          ? "Review sent. Next day unlocked for this trainee."
          : "Review shared with trainee."
      );
      window.setTimeout(() => setNotification(""), 2500);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to save review");
    } finally {
      setIsSaving(false);
    }
  };

  const lastMessage = submission.messages[submission.messages.length - 1];
  const hasUnreadReply = lastMessage?.role === "trainee" && !submission.adminReplyRead;

  return (
    <div className="mt-4 space-y-3">
      {hasUnreadReply && (
        <p className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900">
          New trainee message — scroll the chat above to read it.
        </p>
      )}

      {notification && (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
          {notification}
        </p>
      )}

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
          {error}
        </p>
      )}

      <SubmissionChat
        submission={submission}
        mode="admin"
        reviewStatus={reviewStatus}
        onReviewStatusChange={setReviewStatus}
        composeValue={composeValue}
        onComposeChange={setComposeValue}
        onSend={() => void handleSaveReview()}
        isSaving={isSaving}
        sendLabel="Save & Share with Trainee"
        showStatusPicker
      />
    </div>
  );
};
