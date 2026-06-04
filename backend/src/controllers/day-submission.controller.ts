import type { Request, Response } from "express";

import {
  getSubmissionForTraineeDay,
  getSubmissionsForDay,
  getSubmissionsForTrainee,
  getSubmissionStats,
  removeSubmissionAttachment,
  upsertDaySubmission
} from "../services/day-submission.service.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";

const getUserId = (request: Request) => {
  if (!request.user?.id) {
    throw new ApiError(401, "Authentication required");
  }

  return request.user.id;
};

const getRouteParam = (value: string | string[] | undefined, name: string) => {
  if (!value || Array.isArray(value)) {
    throw new ApiError(400, `${name} is required`);
  }

  return value;
};

export const getMyDaySubmissionHandler = asyncHandler(
  async (request: Request, response: Response) => {
    const dayNumber = Number(getRouteParam(request.params.dayNumber, "Day number"));
    const submission = await getSubmissionForTraineeDay(getUserId(request), dayNumber);

    response.status(200).json({
      success: true,
      message: submission ? "Submission fetched successfully" : "No submission yet",
      data: { submission }
    });
  }
);

export const upsertMyDaySubmissionHandler = asyncHandler(
  async (request: Request, response: Response) => {
    const dayNumber = Number(request.body.dayNumber);

    if (Number.isNaN(dayNumber)) {
      throw new ApiError(400, "Day number is required");
    }

    const files = (request.files as Express.Multer.File[] | undefined) ?? [];
    const submission = await upsertDaySubmission({
      traineeId: getUserId(request),
      dayNumber,
      content: String(request.body.content ?? ""),
      files
    });

    response.status(200).json({
      success: true,
      message: "Submission saved successfully",
      data: { submission }
    });
  }
);

export const deleteMySubmissionAttachmentHandler = asyncHandler(
  async (request: Request, response: Response) => {
    const dayNumber = Number(getRouteParam(request.params.dayNumber, "Day number"));
    const attachmentId = getRouteParam(request.params.attachmentId, "Attachment id");
    const submission = await removeSubmissionAttachment({
      traineeId: getUserId(request),
      dayNumber,
      attachmentId
    });

    response.status(200).json({
      success: true,
      message: "Attachment removed successfully",
      data: { submission }
    });
  }
);

export const listDaySubmissionsForAdminHandler = asyncHandler(
  async (request: Request, response: Response) => {
    const dayNumber = Number(getRouteParam(request.params.dayNumber, "Day number"));
    const submissions = await getSubmissionsForDay(dayNumber);

    response.status(200).json({
      success: true,
      message: "Submissions fetched successfully",
      data: { submissions }
    });
  }
);

export const getSubmissionStatsHandler = asyncHandler(async (_request: Request, response: Response) => {
  const stats = await getSubmissionStats();

  response.status(200).json({
    success: true,
    message: "Submission stats fetched successfully",
    data: stats
  });
});

export const listTraineeSubmissionsForAdminHandler = asyncHandler(
  async (request: Request, response: Response) => {
    const traineeId = getRouteParam(request.params.traineeId, "Trainee id");
    const submissions = await getSubmissionsForTrainee(traineeId);

    response.status(200).json({
      success: true,
      message: "Trainee submissions fetched successfully",
      data: { submissions }
    });
  }
);
