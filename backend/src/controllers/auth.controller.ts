import type { Request, Response } from "express";

import { loginUser, registerUser } from "../services/auth.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const register = asyncHandler(async (request: Request, response: Response) => {
  const { name, email, password } = request.body as {
    name?: string;
    email?: string;
    password?: string;
  };

  if (!name?.trim()) {
    throw new ApiError(400, "Name is required");
  }

  if (!email?.trim() || !emailPattern.test(email)) {
    throw new ApiError(400, "Valid email is required");
  }

  if (!password || password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters long");
  }

  const auth = await registerUser({ name, email, password });

  response.status(201).json({
    success: true,
    message: "User registered successfully",
    data: {
      user: auth.user,
      token: auth.token
    }
  });
});

export const login = asyncHandler(async (request: Request, response: Response) => {
  const { email, password } = request.body as {
    email?: string;
    password?: string;
  };

  if (!email?.trim() || !emailPattern.test(email)) {
    throw new ApiError(400, "Valid email is required");
  }

  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  const auth = await loginUser({ email, password });

  response.status(200).json({
    success: true,
    message: "User logged in successfully",
    data: {
      user: auth.user,
      token: auth.token
    }
  });
});
