import type { ErrorRequestHandler } from "express";
import multer from "multer";

import { ApiError } from "../utils/api-error.js";

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof multer.MulterError) {
    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "Each file must be 15 MB or smaller"
        : error.code === "LIMIT_FILE_COUNT"
          ? "You can upload up to 10 files per submission"
          : error.message;

    response.status(400).json({
      success: false,
      message
    });
    return;
  }

  if (error instanceof Error && error.message.startsWith("File type not allowed")) {
    response.status(400).json({
      success: false,
      message: error.message
    });
    return;
  }

  const statusCode = error instanceof ApiError ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : "Internal server error";

  response.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "production" ? undefined : error.stack
  });
};
