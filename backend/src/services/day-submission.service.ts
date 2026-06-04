import fs from "node:fs/promises";
import path from "node:path";

import { Types } from "mongoose";
import type { Express } from "express";

import { getUploadsDirectory } from "../middleware/upload.middleware.js";
import { DaySubmissionModel } from "../models/day-submission.model.js";
import { ApiError } from "../utils/api-error.js";

const validateDayNumber = (dayNumber: number) => {
  if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 15) {
    throw new ApiError(400, "Day number must be between 1 and 15");
  }
};

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
  validateDayNumber(dayNumber);

  if (!Types.ObjectId.isValid(traineeId)) {
    throw new ApiError(400, "Invalid trainee id");
  }

  return DaySubmissionModel.findOne({
    trainee: traineeId,
    dayNumber
  })
    .populate("trainee", "name email")
    .lean();
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
  validateDayNumber(dayNumber);

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
  validateDayNumber(dayNumber);

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
  validateDayNumber(dayNumber);

  return DaySubmissionModel.find({ dayNumber })
    .populate("trainee", "name email")
    .sort({ updatedAt: -1 })
    .lean();
};

export const getSubmissionsForTrainee = async (traineeId: string) => {
  if (!Types.ObjectId.isValid(traineeId)) {
    throw new ApiError(400, "Invalid trainee id");
  }

  return DaySubmissionModel.find({ trainee: traineeId })
    .populate("trainee", "name email")
    .sort({ dayNumber: 1 })
    .lean();
};

export const getSubmissionStats = async () => {
  const totalSubmissions = await DaySubmissionModel.countDocuments();

  return { totalSubmissions };
};
