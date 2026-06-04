import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

type TokenPayload = {
  id: string;
  role: string;
};

export const signAuthToken = (payload: TokenPayload): string => {
  const options: jwt.SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]
  };

  return jwt.sign(payload, env.JWT_SECRET, options);
};

export const verifyAuthToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
};
