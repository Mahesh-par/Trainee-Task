import type { Request, Response } from "express";

import {
  getSubmissionForTraineeDay,
  getSubmissionsForDay,
  getSubmissionsForTrainee,
  getSubmissionStats,
  getTraineeDayProgress,
  getUnreadReplyCountsByTrainee,
  markTraineeRepliesAsRead,
  removeSubmissionAttachment,
  submitTraineeReply,
  updateSubmissionReview,
  upsertDaySubmission
} from "../services/day-submission.service.js";
import type { SubmissionReviewStatus } from "../models/day-submission.model.js";
import { submissionReviewStatuses } from "../models/day-submission.model.js";
import { resolveCurriculumTrackForUser } from "../utils/resolve-curriculum-track.js";
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

export const getMyDayProgressHandler = asyncHandler(async (request: Request, response: Response) => {
  const progress = await getTraineeDayProgress(getUserId(request));

  response.status(200).json({
    success: true,
    message: "Trainee progress fetched successfully",
    data: { progress }
  });
});

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
    const track = await resolveCurriculumTrackForUser(
      getUserId(request),
      request.user?.role,
      request
    );
    const dayNumber = Number(getRouteParam(request.params.dayNumber, "Day number"));
    const submissions = await getSubmissionsForDay(track, dayNumber);

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

export const submitTraineeReplyHandler = asyncHandler(async (request: Request, response: Response) => {
  const dayNumber = Number(getRouteParam(request.params.dayNumber, "Day number"));
  const { traineeReply } = request.body as { traineeReply?: string };

  const submission = await submitTraineeReply({
    traineeId: getUserId(request),
    dayNumber,
    traineeReply: String(traineeReply ?? "")
  });

  response.status(200).json({
    success: true,
    message: "Reply sent to admin successfully",
    data: { submission }
  });
});

export const getUnreadReplyCountsHandler = asyncHandler(
  async (_request: Request, response: Response) => {
    const unreadReplies = await getUnreadReplyCountsByTrainee();

    response.status(200).json({
      success: true,
      message: "Unread reply counts fetched successfully",
      data: { unreadReplies }
    });
  }
);

export const markTraineeRepliesReadHandler = asyncHandler(
  async (request: Request, response: Response) => {
    const traineeId = getRouteParam(request.params.traineeId, "Trainee id");
    await markTraineeRepliesAsRead(traineeId);

    response.status(200).json({
      success: true,
      message: "Trainee replies marked as read",
      data: null
    });
  }
);

export const updateSubmissionReviewHandler = asyncHandler(
  async (request: Request, response: Response) => {
    const submissionId = getRouteParam(request.params.submissionId, "Submission id");
    const { reviewStatus, adminComment } = request.body as {
      reviewStatus?: SubmissionReviewStatus;
      adminComment?: string;
    };

    if (!reviewStatus || !submissionReviewStatuses.includes(reviewStatus)) {
      throw new ApiError(400, "A valid review status is required");
    }

    const submission = await updateSubmissionReview({
      submissionId,
      reviewStatus,
      adminComment: String(adminComment ?? ""),
      adminId: getUserId(request)
    });

    response.status(200).json({
      success: true,
      message: "Submission review saved successfully",
      data: { submission }
    });
  }
);
