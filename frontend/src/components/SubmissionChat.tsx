import { MessageSquare, Send } from "lucide-react";
import { useEffect, useRef } from "react";

import type { DaySubmission, SubmissionMessage, SubmissionReviewStatus } from "../types";
import { SubmissionReviewStatusBadge } from "./SubmissionReviewStatusBadge";

type SubmissionChatProps = {
  submission: DaySubmission;
  mode: "trainee" | "admin";
  reviewStatus?: SubmissionReviewStatus | "";
  onReviewStatusChange?: (status: SubmissionReviewStatus) => void;
  composeValue: string;
  onComposeChange: (value: string) => void;
  onSend: () => void;
  isSaving?: boolean;
  sendLabel?: string;
  showStatusPicker?: boolean;
};

const statusOptions: Array<{ value: SubmissionReviewStatus; label: string }> = [
  { value: "done", label: "DONE" },
  { value: "need_improvement", label: "NEED IMPROVEMENT" },
  { value: "cancel", label: "CANCEL" }
];

const formatTime = (value: string) => new Date(value).toLocaleString();

function ChatBubble({ message, mode }: { message: SubmissionMessage; mode: "trainee" | "admin" }) {
  const isAdminMessage = message.role === "admin";
  const isOwnMessage =
    mode === "admin" ? isAdminMessage : !isAdminMessage;

  return (
    <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-sm ${
          isAdminMessage
            ? "rounded-br-md bg-navy-900 text-white"
            : "rounded-bl-md border border-emerald-200 bg-white text-emerald-950"
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={`text-[10px] font-extrabold uppercase tracking-wide ${
              isAdminMessage ? "text-white/70" : "text-emerald-800"
            }`}
          >
            {isAdminMessage ? "Admin" : mode === "trainee" ? "You" : "Trainee"}
          </p>
          {message.reviewStatus && (
            <SubmissionReviewStatusBadge status={message.reviewStatus} />
          )}
        </div>
        <p
          className={`mt-2 whitespace-pre-wrap text-sm leading-6 ${
            isAdminMessage ? "text-white" : "text-emerald-950"
          }`}
        >
          {message.body}
        </p>
        <p
          className={`mt-2 text-[11px] font-semibold ${
            isAdminMessage ? "text-white/60" : "text-emerald-700/80"
          }`}
        >
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}

export function SubmissionChat({
  submission,
  mode,
  reviewStatus = "",
  onReviewStatusChange,
  composeValue,
  onComposeChange,
  onSend,
  isSaving = false,
  sendLabel,
  showStatusPicker = false
}: SubmissionChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messages = submission.messages ?? [];
  const canCompose = mode === "admin" || Boolean(submission.reviewStatus);

  useEffect(() => {
    const container = scrollRef.current;

    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages.length, composeValue]);

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-navy-800" />
          <h4 className="text-sm font-extrabold uppercase tracking-wide text-gray-800">
            Feedback Chat
          </h4>
        </div>
        {submission.reviewStatus && (
          <SubmissionReviewStatusBadge status={submission.reviewStatus} />
        )}
      </div>

      <div
        ref={scrollRef}
        className="max-h-80 space-y-3 overflow-y-auto bg-gradient-to-b from-gray-50 to-white px-4 py-4 scrollbar-thin"
      >
        {messages.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-500">
            {mode === "admin"
              ? "No messages yet. Send the first review below."
              : "No admin feedback yet. You can reply here once the admin reviews your work."}
          </p>
        ) : (
          messages.map((message) => <ChatBubble key={message.id} message={message} mode={mode} />)
        )}
      </div>

      {canCompose && (
        <div className="border-t border-gray-100 bg-white p-4">
          {showStatusPicker && onReviewStatusChange && (
            <div className="mb-3">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Status</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {statusOptions.map((option) => {
                  const isSelected = reviewStatus === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onReviewStatusChange(option.value)}
                      className={`rounded-md border px-3 py-2 text-xs font-extrabold uppercase tracking-wide transition ${
                        isSelected
                          ? "border-navy-800 bg-navy-900 text-white"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">
            {mode === "admin" ? "Message for trainee" : "Your message"}
            <textarea
              value={composeValue}
              onChange={(event) => onComposeChange(event.target.value)}
              rows={3}
              placeholder={
                mode === "admin"
                  ? "Share feedback, improvements, or next steps..."
                  : "Reply to admin feedback..."
              }
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm leading-6 text-gray-800"
            />
          </label>

          <button
            type="button"
            onClick={onSend}
            disabled={
              isSaving ||
              !composeValue.trim() ||
              (mode === "admin" && showStatusPicker && !reviewStatus)
            }
            className="mt-3 inline-flex items-center gap-2 rounded-md bg-navy-900 px-4 py-2 text-sm font-bold text-white hover:bg-navy-800 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
          >
            <Send className="h-4 w-4" />
            {isSaving ? "Sending..." : sendLabel ?? "Send"}
          </button>

          {mode === "admin" && reviewStatus === "done" && (
            <p className="mt-2 text-xs font-semibold text-emerald-700">
              Saving DONE unlocks the next training day for this trainee.
            </p>
          )}
        </div>
      )}
    </section>
  );
};
