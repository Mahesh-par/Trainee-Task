import type { Request, Response } from "express";

import {
  getProgramSettings,
  updateTotalDays
} from "../services/program-settings.service.js";
import { resolveCurriculumTrackForUser } from "../utils/resolve-curriculum-track.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";

const getUserId = (request: Request) => {
  if (!request.user?.id) {
    throw new ApiError(401, "Authentication required");
  }

  return request.user.id;
};

export const getProgramSettingsHandler = asyncHandler(
  async (request: Request, response: Response) => {
    const track = await resolveCurriculumTrackForUser(
      getUserId(request),
      request.user?.role,
      request
    );
    const settings = await getProgramSettings(track);

    response.status(200).json({
      success: true,
      message: "Program settings fetched successfully",
      data: settings
    });
  }
);

export const updateProgramSettingsHandler = asyncHandler(
  async (request: Request, response: Response) => {
    const track = await resolveCurriculumTrackForUser(
      getUserId(request),
      request.user?.role,
      request
    );
    const { totalDays } = request.body as { totalDays?: number };

    if (totalDays === undefined || Number.isNaN(Number(totalDays))) {
      throw new ApiError(400, "Total days is required");
    }

    const settings = await updateTotalDays(track, Number(totalDays));

    response.status(200).json({
      success: true,
      message: "Program settings updated successfully",
      data: settings
    });
  }
);
