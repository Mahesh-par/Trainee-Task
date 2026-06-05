import { useState } from "react";

import { submitTraineeReply } from "../lib/api";
import type { DaySubmission } from "../types";
import { SubmissionChat } from "./SubmissionChat";

type SubmissionTraineeFeedbackProps = {
  submission: DaySubmission;
  dayNumber: number;
  onReplySaved: (submission: DaySubmission) => void;
};

export function SubmissionTraineeFeedback({
  submission,
  dayNumber,
  onReplySaved
}: SubmissionTraineeFeedbackProps) {
  const [composeValue, setComposeValue] = useState("");
  const [error, setError] = useState("");
  const [notification, setNotification] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!submission.reviewStatus && submission.messages.length === 0) {
    return null;
  }

  const handleSendReply = async () => {
    if (!composeValue.trim()) {
      setError("Please write a message before sending.");
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      const updatedSubmission = await submitTraineeReply(dayNumber, composeValue);
      onReplySaved(updatedSubmission);
      setComposeValue("");
      setNotification("Message sent to your admin.");
      window.setTimeout(() => setNotification(""), 2500);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to send message");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-6 space-y-3">
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
        mode="trainee"
        composeValue={composeValue}
        onComposeChange={setComposeValue}
        onSend={() => void handleSendReply()}
        isSaving={isSaving}
        sendLabel="Send Message"
      />
    </div>
  );
};
