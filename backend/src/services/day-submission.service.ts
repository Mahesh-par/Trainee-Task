import fs from "node:fs/promises";
import path from "node:path";

import { Types } from "mongoose";
import type { Express } from "express";

import { getUploadsDirectory } from "../middleware/upload.middleware.js";
import { DaySubmissionModel } from "../models/day-submission.model.js";
import type { SubmissionReviewStatus } from "../models/day-submission.model.js";
import { submissionReviewStatuses } from "../models/day-submission.model.js";
import { getTotalDays, validateDayInProgram } from "./program-settings.service.js";
import { ApiError } from "../utils/api-error.js";
import { enrichSubmissionDocument, getLastMessageRole } from "../utils/submission-messages.js";

const enrichSubmission = <T extends Record<string, unknown>>(submission: T | null) =>
  submission ? enrichSubmissionDocument(submission) : null;

const enrichSubmissions = <T extends Record<string, unknown>>(submissions: T[]) =>
  submissions.map((submission) => enrichSubmissionDocument(submission));

const mapUploadedFiles = (files: Express.Multer.File[]) =>
  files.map((file) => ({
    originalName: file.originalname,
    storedName: file.filename,
    mimeType: file.mimetype,
    size: file.size
  }));

const removeFilesFromDisk = async (storedNames: string[]) => {
  const uploadsDir = getUploadsDirectory();

  await Promise.all(
    storedNames.map(async (storedName) => {
      try {
        await fs.unlink(path.join(uploadsDir, storedName));
      } catch {
        // Ignore missing files during cleanup.
      }
    })
  );
};

export const getSubmissionForTraineeDay = async (traineeId: string, dayNumber: number) => {
  await validateDayInProgram(dayNumber);

  if (!Types.ObjectId.isValid(traineeId)) {
    throw new ApiError(400, "Invalid trainee id");
  }

  const submission = await DaySubmissionModel.findOne({
    trainee: traineeId,
    dayNumber
  })
    .populate("trainee", "name email")
    .populate("reviewedBy", "name email")
    .lean();

  return enrichSubmission(submission);
};

export const upsertDaySubmission = async ({
  traineeId,
  dayNumber,
  content,
  files
}: {
  traineeId: string;
  dayNumber: number;
  content: string;
  files: Express.Multer.File[];
}) => {
  await validateDayInProgram(dayNumber);

  if (!Types.ObjectId.isValid(traineeId)) {
    throw new ApiError(400, "Invalid trainee id");
  }

  const trimmedContent = content.trim();
  const uploadedAttachments = mapUploadedFiles(files);

  if (!trimmedContent && uploadedAttachments.length === 0) {
    throw new ApiError(400, "Add submission text or at least one attachment");
  }

  const existingSubmission = await DaySubmissionModel.findOne({
    trainee: traineeId,
    dayNumber
  });

  if (existingSubmission) {
    if (!trimmedContent && existingSubmission.attachments.length === 0 && uploadedAttachments.length === 0) {
      throw new ApiError(400, "Add submission text or at least one attachment");
    }

    existingSubmission.content = trimmedContent;

    for (const attachment of uploadedAttachments) {
      existingSubmission.attachments.push(attachment);
    }

    await existingSubmission.save();

    return existingSubmission.populate("trainee", "name email");
  }

  const submission = await DaySubmissionModel.create({
    trainee: traineeId,
    dayNumber,
    content: trimmedContent,
    attachments: uploadedAttachments
  });

  return submission.populate("trainee", "name email");
};

export const removeSubmissionAttachment = async ({
  traineeId,
  dayNumber,
  attachmentId
}: {
  traineeId: string;
  dayNumber: number;
  attachmentId: string;
}) => {
  await validateDayInProgram(dayNumber);

  if (!Types.ObjectId.isValid(traineeId)) {
    throw new ApiError(400, "Invalid trainee id");
  }

  const submission = await DaySubmissionModel.findOne({
    trainee: traineeId,
    dayNumber
  });

  if (!submission) {
    throw new ApiError(404, "Submission not found");
  }

  const attachment = submission.attachments.id(attachmentId);

  if (!attachment) {
    throw new ApiError(404, "Attachment not found");
  }

  await removeFilesFromDisk([attachment.storedName]);
  attachment.deleteOne();
  await submission.save();

  return submission.populate("trainee", "name email");
};

export const getSubmissionsForDay = async (dayNumber: number) => {
  await validateDayInProgram(dayNumber);

  const submissions = await DaySubmissionModel.find({ dayNumber })
    .populate("trainee", "name email")
    .sort({ updatedAt: -1 })
    .lean();

  return enrichSubmissions(submissions);
};

export const getSubmissionsForTrainee = async (traineeId: string) => {
  if (!Types.ObjectId.isValid(traineeId)) {
    throw new ApiError(400, "Invalid trainee id");
  }

  const submissions = await DaySubmissionModel.find({ trainee: traineeId })
    .populate("trainee", "name email")
    .populate("reviewedBy", "name email")
    .sort({ dayNumber: 1 })
    .lean();

  return enrichSubmissions(submissions);
};

export const getTraineeDayProgress = async (traineeId: string) => {
  if (!Types.ObjectId.isValid(traineeId)) {
    throw new ApiError(400, "Invalid trainee id");
  }

  const doneSubmissions = await DaySubmissionModel.find({
    trainee: traineeId,
    reviewStatus: "done"
  })
    .select("dayNumber")
    .lean();

  const doneDays = doneSubmissions
    .map((submission) => submission.dayNumber)
    .sort((left, right) => left - right);
  const totalDays = await getTotalDays();
  const highestDoneDay = doneDays[doneDays.length - 1] ?? 0;
  const unlockedDay = Math.min(Math.max(highestDoneDay + 1, 1), totalDays);
  const programCompleted = highestDoneDay >= totalDays;

  return {
    unlockedDay,
    doneDays,
    currentDay: programCompleted ? totalDays : unlockedDay,
    programCompleted,
    totalDays
  };
};

export const getSubmissionStats = async () => {
  const totalSubmissions = await DaySubmissionModel.countDocuments();

  return { totalSubmissions };
};

export const updateSubmissionReview = async ({
  submissionId,
  reviewStatus,
  adminComment,
  adminId
}: {
  submissionId: string;
  reviewStatus: SubmissionReviewStatus;
  adminComment: string;
  adminId: string;
}) => {
  if (!Types.ObjectId.isValid(submissionId)) {
    throw new ApiError(400, "Invalid submission id");
  }

  if (!submissionReviewStatuses.includes(reviewStatus)) {
    throw new ApiError(400, "Invalid review status");
  }

  if (!Types.ObjectId.isValid(adminId)) {
    throw new ApiError(400, "Invalid admin id");
  }

  const submission = await DaySubmissionModel.findById(submissionId);

  if (!submission) {
    throw new ApiError(404, "Submission not found");
  }

  const trimmedComment = adminComment.trim();
  const reviewedAt = new Date();

  submission.reviewStatus = reviewStatus;
  submission.adminComment = trimmedComment;
  submission.reviewedAt = reviewedAt;
  submission.reviewedBy = new Types.ObjectId(adminId);

  if (trimmedComment || reviewStatus) {
    submission.messages.push({
      role: "admin",
      body: trimmedComment || `Status updated to ${reviewStatus.replace("_", " ")}`,
      reviewStatus,
      createdAt: reviewedAt
    });
  }

  await submission.save();

  const savedSubmission = await DaySubmissionModel.findById(submission._id)
    .populate("trainee", "name email")
    .populate("reviewedBy", "name email")
    .lean();

  return enrichSubmission(savedSubmission);
};

export const submitTraineeReply = async ({
  traineeId,
  dayNumber,
  traineeReply
}: {
  traineeId: string;
  dayNumber: number;
  traineeReply: string;
}) => {
  await validateDayInProgram(dayNumber);

  if (!Types.ObjectId.isValid(traineeId)) {
    throw new ApiError(400, "Invalid trainee id");
  }

  const trimmedReply = traineeReply.trim();

  if (!trimmedReply) {
    throw new ApiError(400, "Reply cannot be empty");
  }

  const submission = await DaySubmissionModel.findOne({
    trainee: traineeId,
    dayNumber
  });

  if (!submission) {
    throw new ApiError(404, "Submission not found");
  }

  if (!submission.reviewStatus) {
    throw new ApiError(400, "Admin feedback is required before you can reply");
  }

  const repliedAt = new Date();

  submission.traineeReply = trimmedReply;
  submission.traineeRepliedAt = repliedAt;
  submission.adminReplyRead = false;
  submission.messages.push({
    role: "trainee",
    body: trimmedReply,
    createdAt: repliedAt
  });
  await submission.save();

  const savedSubmission = await DaySubmissionModel.findById(submission._id)
    .populate("trainee", "name email")
    .populate("reviewedBy", "name email")
    .lean();

  return enrichSubmission(savedSubmission);
};

export const getUnreadReplyCountsByTrainee = async () => {
  const results = await DaySubmissionModel.aggregate<{ _id: Types.ObjectId; count: number }>([
    {
      $match: {
        adminReplyRead: false,
        $or: [
          {
            messages: { $exists: true, $not: { $size: 0 } },
            $expr: { $eq: [{ $arrayElemAt: ["$messages.role", -1] }, "trainee"] }
          },
          { traineeReply: { $nin: [null, ""] } }
        ]
      }
    },
    {
      $group: {
        _id: "$trainee",
        count: { $sum: 1 }
      }
    }
  ]);

  return results.map((item) => ({
    traineeId: item._id.toString(),
    count: item.count
  }));
};

export const markTraineeRepliesAsRead = async (traineeId: string) => {
  if (!Types.ObjectId.isValid(traineeId)) {
    throw new ApiError(400, "Invalid trainee id");
  }

  const submissions = await DaySubmissionModel.find({
    trainee: traineeId,
    adminReplyRead: false
  });

  const unreadSubmissionIds = submissions
    .filter((submission) => getLastMessageRole(submission) === "trainee")
    .map((submission) => submission._id);

  if (unreadSubmissionIds.length > 0) {
    await DaySubmissionModel.updateMany(
      { _id: { $in: unreadSubmissionIds } },
      { adminReplyRead: true }
    );
  }
};
