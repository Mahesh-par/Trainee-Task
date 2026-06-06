import type { Request, Response } from "express";

import { getTrainees, updateTraineeRole } from "../services/user.service.js";
import { parseCurriculumTrack } from "../utils/resolve-curriculum-track.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";

const getRouteParam = (value: string | string[] | undefined, name: string) => {
  if (!value || Array.isArray(value)) {
    throw new ApiError(400, `${name} is required`);
  }

  return value;
};

export const getTraineesHandler = asyncHandler(
  async (_request: Request, response: Response) => {
    const trainees = await getTrainees();

    response.status(200).json({
      success: true,
      message: "Trainees fetched successfully",
      data: {
        trainees
      }
    });
  }
);

export const updateTraineeRoleHandler = asyncHandler(
  async (request: Request, response: Response) => {
    const traineeId = getRouteParam(request.params.traineeId, "Trainee id");
    const { traineeRole } = request.body as { traineeRole?: string };
    const track = parseCurriculumTrack(traineeRole);
    const trainee = await updateTraineeRole(traineeId, track);

    response.status(200).json({
      success: true,
      message: "Trainee role updated successfully",
      data: { trainee }
    });
  }
);
