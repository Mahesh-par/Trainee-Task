import { FileUp, Paperclip, Send, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";

import {
  deleteSubmissionAttachment,
  fetchMyDaySubmission,
  submitDaySubmission
} from "../lib/api";
import type { DaySubmission } from "../types";

type CourseDaySubmissionProps = {
  dayNumber: number;
};

type SubmissionBaseline = {
  content: string;
  attachmentIds: string[];
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function CourseDaySubmission({ dayNumber }: CourseDaySubmissionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submission, setSubmission] = useState<DaySubmission | null>(null);
  const [content, setContent] = useState("");
  const [baseline, setBaseline] = useState<SubmissionBaseline>({
    content: "",
    attachmentIds: []
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const syncBaseline = useCallback((nextSubmission: DaySubmission | null, nextContent: string) => {
    setBaseline({
      content: nextContent,
      attachmentIds: (nextSubmission?.attachments ?? []).map((attachment) => attachment.id).sort()
    });
  }, []);

  const loadSubmission = useCallback(async () => {
    setError("");
    setIsLoading(true);

    try {
      const existingSubmission = await fetchMyDaySubmission(dayNumber);
      const savedContent = existingSubmission?.content ?? "";
      setSubmission(existingSubmission);
      setContent(savedContent);
      setSelectedFiles([]);
      syncBaseline(existingSubmission, savedContent);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load submission");
    } finally {
      setIsLoading(false);
    }
  }, [dayNumber, syncBaseline]);

  useEffect(() => {
    void loadSubmission();
  }, [loadSubmission]);

  const currentAttachmentIds = useMemo(
    () => (submission?.attachments ?? []).map((attachment) => attachment.id).sort().join(","),
    [submission]
  );

  const baselineAttachmentIds = useMemo(
    () => [...baseline.attachmentIds].sort().join(","),
    [baseline.attachmentIds]
  );

  const isDirty = useMemo(() => {
    return (
      content !== baseline.content ||
      selectedFiles.length > 0 ||
      currentAttachmentIds !== baselineAttachmentIds
    );
  }, [baseline.content, baselineAttachmentIds, content, currentAttachmentIds, selectedFiles.length]);

  const hasSubmittableContent = useMemo(() => {
    return (
      content.trim().length > 0 ||
      selectedFiles.length > 0 ||
      (submission?.attachments.length ?? 0) > 0
    );
  }, [content, selectedFiles.length, submission?.attachments.length]);

  const canSubmit = isDirty && hasSubmittableContent && !isSubmitting;

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    setSelectedFiles(files);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const savedSubmission = await submitDaySubmission({
        dayNumber,
        content,
        files: selectedFiles
      });
      setSubmission(savedSubmission);
      setContent(savedSubmission.content);
      setSelectedFiles([]);
      syncBaseline(savedSubmission, savedSubmission.content);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setNotification("Submission saved successfully.");
      window.setTimeout(() => setNotification(""), 2500);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to save submission");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveAttachment = async (attachmentId: string) => {
    setError("");
    setIsSubmitting(true);

    try {
      const updatedSubmission = await deleteSubmissionAttachment(dayNumber, attachmentId);
      setSubmission(updatedSubmission);
      syncBaseline(updatedSubmission, content);
      setNotification("Attachment removed.");
      window.setTimeout(() => setNotification(""), 2500);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to remove attachment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-lg border border-violet-200 bg-violet-50 p-5 shadow-soft">
      <div className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-violet-900">
        <Upload className="h-4 w-4" />
        Submission
      </div>
      <p className="mt-2 text-sm leading-6 text-violet-950">
        Paste your work (code, notes, links) and/or attach files such as PDF, Word, images, ZIP, or
        theme code. You can update this submission anytime.
      </p>

      {notification && (
        <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
          {notification}
        </p>
      )}

      {error && (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      {isLoading ? (
        <p className="mt-4 text-sm font-semibold text-violet-900">Loading your submission...</p>
      ) : (
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-bold text-violet-950">
            Paste submission
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={8}
              placeholder="Paste HTML/CSS code, GitHub link, notes, or describe what you completed..."
              className="mt-2 w-full rounded-md border border-violet-200 bg-white px-3 py-2 font-mono text-sm leading-6 text-gray-800"
            />
          </label>

          <div>
            <label className="block text-sm font-bold text-violet-950">
              Attach files
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-violet-300 bg-white px-4 py-2 text-sm font-bold text-violet-900 hover:bg-violet-100">
                  <FileUp className="h-4 w-4" />
                  Choose files
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.txt,.md,.html,.htm,.css,.js,.ts,.tsx,.jsx,.json,.liquid,.zip,.rar,.png,.jpg,.jpeg,.gif,.webp,.svg,.csv,.xls,.xlsx,.ppt,.pptx"
                  />
                </label>
                {selectedFiles.length > 0 && (
                  <span className="text-xs font-semibold text-violet-800">
                    {selectedFiles.length} new file(s) selected
                  </span>
                )}
              </div>
            </label>
            {selectedFiles.length > 0 && (
              <ul className="mt-2 space-y-1">
                {selectedFiles.map((file) => (
                  <li key={`${file.name}-${file.size}`} className="text-xs font-semibold text-violet-900">
                    {file.name} ({formatFileSize(file.size)})
                  </li>
                ))}
              </ul>
            )}
          </div>

          {submission && submission.attachments.length > 0 && (
            <div className="rounded-md border border-violet-200 bg-white p-3">
              <p className="text-xs font-extrabold uppercase tracking-wide text-violet-800">
                Uploaded attachments
              </p>
              <ul className="mt-2 space-y-2">
                {submission.attachments.map((attachment) => (
                  <li
                    key={attachment.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-gray-200 px-3 py-2"
                  >
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-navy-800 hover:underline"
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                      {attachment.originalName}
                      <span className="text-xs text-gray-500">({formatFileSize(attachment.size)})</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => void handleRemoveAttachment(attachment.id)}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-60"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {submission?.updatedAt && (
            <p className="text-xs font-semibold text-violet-800">
              Last updated: {new Date(submission.updatedAt).toLocaleString()}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-bold transition ${
              canSubmit
                ? "bg-violet-900 text-white hover:bg-violet-800"
                : "cursor-not-allowed bg-gray-300 text-gray-500"
            }`}
          >
            <Send className="h-4 w-4" />
            {isSubmitting
              ? "Saving..."
              : submission
                ? isDirty
                  ? "Update Submission"
                  : "Up to date"
                : "Submit Work"}
          </button>
        </form>
      )}
    </section>
  );
}
