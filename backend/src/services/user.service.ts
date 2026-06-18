import { Types } from "mongoose";

import type { CurriculumTrack } from "../constants/curriculum-tracks.js";
import { DEFAULT_CURRICULUM_TRACK, isCurriculumTrack } from "../constants/curriculum-tracks.js";
import { DaySubmissionModel } from "../models/day-submission.model.js";
import { UserModel } from "../models/user.model.js";
import { ApiError } from "../utils/api-error.js";
import { getTotalDays } from "./program-settings.service.js";

const enrichTraineeWithCurriculumProgress = async <T extends { _id: Types.ObjectId; traineeRole?: CurriculumTrack }>(
  trainee: T
) => {
  const track = trainee.traineeRole ?? DEFAULT_CURRICULUM_TRACK;
  const [submittedDays, totalDays] = await Promise.all([
    DaySubmissionModel.distinct("dayNumber", { trainee: trainee._id, track }),
    getTotalDays(track)
  ]);
  const daysCompleted = submittedDays.length;
  const daysRemaining = Math.max(totalDays - daysCompleted, 0);
  const progress = totalDays > 0 ? Math.round((daysCompleted / totalDays) * 100) : 0;
  const status =
    daysCompleted === 0 ? "not_started" : daysCompleted >= totalDays ? "completed" : "active";

  return {
    ...trainee,
    daysCompleted,
    daysRemaining,
    totalDays,
    progress,
    status
  };
};

export const getTrainees = async () => {
  const trainees = await UserModel.find({ role: "user" })
    .select("_id name email role createdAt traineeRole")
    .sort({ createdAt: -1 })
    .lean();

  return Promise.all(trainees.map(enrichTraineeWithCurriculumProgress));
};

export const updateTraineeRole = async (traineeId: string, traineeRole: CurriculumTrack) => {
  if (!isCurriculumTrack(traineeRole)) {
    throw new ApiError(400, "A valid trainee role is required");
  }

  const trainee = await UserModel.findOneAndUpdate(
    { _id: traineeId, role: "user" },
    { traineeRole },
    { new: true }
  )
    .select("_id name email role createdAt traineeRole")
    .lean();

  if (!trainee) {
    throw new ApiError(404, "Trainee not found");
  }

  return enrichTraineeWithCurriculumProgress(trainee);
};
