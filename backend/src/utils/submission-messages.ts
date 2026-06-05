import type { SubmissionReviewStatus } from "../models/day-submission.model.js";

export type SubmissionMessageRole = "admin" | "trainee";

export type SubmissionMessage = {
  id: string;
  role: SubmissionMessageRole;
  body: string;
  reviewStatus?: SubmissionReviewStatus | null;
  createdAt: string;
};

type LegacySubmission = {
  messages?: Array<{
    _id?: { toString(): string };
    id?: string;
    role?: SubmissionMessageRole;
    body?: string;
    reviewStatus?: SubmissionReviewStatus | null;
    createdAt?: Date | string;
  }>;
  adminComment?: string;
  reviewStatus?: SubmissionReviewStatus | null;
  reviewedAt?: Date | string | null;
  traineeReply?: string;
  traineeRepliedAt?: Date | string | null;
};

const toIso = (value?: Date | string | null) => {
  if (!value) {
    return new Date().toISOString();
  }

  return new Date(value).toISOString();
};

export const buildMessagesFromLegacy = (submission: LegacySubmission): SubmissionMessage[] => {
  if (submission.messages && submission.messages.length > 0) {
    return [...submission.messages]
      .map((message, index) => ({
        id: message._id?.toString() ?? message.id ?? `message-${index}`,
        role: (message.role === "trainee" ? "trainee" : "admin") as SubmissionMessageRole,
        body: String(message.body ?? ""),
        reviewStatus: message.reviewStatus ?? null,
        createdAt: toIso(message.createdAt)
      }))
      .filter((message) => message.body.trim().length > 0)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }

  const legacyMessages: SubmissionMessage[] = [];

  if (submission.adminComment?.trim() && submission.reviewStatus) {
    legacyMessages.push({
      id: "legacy-admin",
      role: "admin",
      body: submission.adminComment.trim(),
      reviewStatus: submission.reviewStatus,
      createdAt: toIso(submission.reviewedAt)
    });
  }

  if (submission.traineeReply?.trim()) {
    legacyMessages.push({
      id: "legacy-trainee",
      role: "trainee",
      body: submission.traineeReply.trim(),
      createdAt: toIso(submission.traineeRepliedAt)
    });
  }

  return legacyMessages;
};

export const enrichSubmissionDocument = <T extends LegacySubmission>(submission: T) => ({
  ...submission,
  messages: buildMessagesFromLegacy(submission)
});

export const getLastMessageRole = (submission: LegacySubmission): SubmissionMessageRole | null => {
  const messages = buildMessagesFromLegacy(submission);
  return messages[messages.length - 1]?.role ?? null;
};
