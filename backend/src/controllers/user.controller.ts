import type { Request, Response } from "express";

import { getTrainees } from "../services/user.service.js";
import { asyncHandler } from "../utils/async-handler.js";

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
