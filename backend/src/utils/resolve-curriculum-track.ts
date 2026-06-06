import type { Request } from "express";

import {
  DEFAULT_CURRICULUM_TRACK,
  isCurriculumTrack,
  type CurriculumTrack
} from "../constants/curriculum-tracks.js";
import { UserModel } from "../models/user.model.js";
import { ApiError } from "./api-error.js";

export const parseCurriculumTrack = (value: unknown): CurriculumTrack => {
  const track = String(value ?? "").trim();

  if (!isCurriculumTrack(track)) {
    throw new ApiError(400, "A valid curriculum track is required");
  }

  return track;
};

export const resolveCurriculumTrackForAdmin = (request: Request): CurriculumTrack => {
  const trackValue = request.query.track ?? request.body?.track;

  if (!trackValue) {
    throw new ApiError(400, "Curriculum track query parameter is required");
  }

  return parseCurriculumTrack(trackValue);
};

export const resolveCurriculumTrackForUser = async (
  userId: string,
  role: string | undefined,
  request: Request
): Promise<CurriculumTrack> => {
  if (role === "admin") {
    return resolveCurriculumTrackForAdmin(request);
  }

  const user = await UserModel.findById(userId).select("traineeRole").lean();

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user.traineeRole ?? DEFAULT_CURRICULUM_TRACK;
};
