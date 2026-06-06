import type { CurriculumTrack } from "../constants/curriculum-tracks.js";
import { isCurriculumTrack } from "../constants/curriculum-tracks.js";
import { UserModel } from "../models/user.model.js";
import { ApiError } from "../utils/api-error.js";

export const getTrainees = async () => {
  return UserModel.find({ role: "user" })
    .select("_id name email role createdAt traineeRole")
    .sort({ createdAt: -1 })
    .lean();
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

  return trainee;
};
