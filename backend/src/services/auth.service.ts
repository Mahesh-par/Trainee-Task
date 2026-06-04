import bcrypt from "bcryptjs";

import { ApiError } from "../utils/api-error.js";
import { signAuthToken } from "../utils/jwt.js";
import { UserModel } from "../models/user.model.js";

type RegisterUserInput = {
  name: string;
  email: string;
  password: string;
};

type LoginUserInput = {
  email: string;
  password: string;
};

const createAuthResponse = (user: {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
}) => {
  const token = signAuthToken({
    id: user.id,
    role: user.role
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    }
  };
};

export const registerUser = async ({ name, email, password }: RegisterUserInput) => {
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await UserModel.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  const user = await UserModel.create({
    name: name.trim(),
    email: normalizedEmail,
    password
  });

  return createAuthResponse({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
  });
};

export const loginUser = async ({ email, password }: LoginUserInput) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await UserModel.findOne({ email: normalizedEmail }).select("+password");

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  return createAuthResponse({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
  });
};
