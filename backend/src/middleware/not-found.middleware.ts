import type { RequestHandler } from "express";

import { ApiError } from "../utils/api-error.js";

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(new ApiError(404, `Route not found: ${request.method} ${request.originalUrl}`));
};
