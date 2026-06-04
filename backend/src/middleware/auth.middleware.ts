import type { RequestHandler } from "express";

import { UserModel } from "../models/user.model.js";
import { ApiError } from "../utils/api-error.js";
import { verifyAuthToken } from "../utils/jwt.js";

export const authenticate: RequestHandler = async (request, _response, next) => {
  try {
    const authHeader = request.header("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

    if (!token) {
      throw new ApiError(401, "Authentication token is required");
    }

    const payload = verifyAuthToken(token);
    const user = await UserModel.findById(payload.id).select("_id role");

    if (!user) {
      throw new ApiError(401, "Invalid authentication token");
    }

    request.user = {
      id: user.id,
      role: user.role as "admin" | "user"
    };

    next();
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(401, "Invalid authentication token"));
  }
};

export const authorize = (...roles: Array<"admin" | "user">): RequestHandler => {
  return (request, _response, next) => {
    if (!request.user || !roles.includes(request.user.role)) {
      next(new ApiError(403, "You are not allowed to access this resource"));
      return;
    }

    next();
  };
};
