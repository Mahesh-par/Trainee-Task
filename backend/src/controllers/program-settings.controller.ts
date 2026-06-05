import type { Request, Response } from "express";

import {
  getProgramSettings,
  updateTotalDays
} from "../services/program-settings.service.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";

export const getProgramSettingsHandler = asyncHandler(
  async (_request: Request, response: Response) => {
    const settings = await getProgramSettings();

    response.status(200).json({
      success: true,
      message: "Program settings fetched successfully",
      data: settings
    });
  }
);

export const updateProgramSettingsHandler = asyncHandler(
  async (request: Request, response: Response) => {
    const { totalDays } = request.body as { totalDays?: number };

    if (totalDays === undefined || Number.isNaN(Number(totalDays))) {
      throw new ApiError(400, "Total days is required");
    }

    const settings = await updateTotalDays(Number(totalDays));

    response.status(200).json({
      success: true,
      message: "Program settings updated successfully",
      data: settings
    });
  }
);
