import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { apiRequest, clearAuthSession, getStoredUser, setAuthSession } from "../lib/api";
import type { AuthUser } from "../types";

type AuthContextValue = {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (name: string, email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
};

type AuthResponse = {
  user: AuthUser;
  token: string;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login: async (email, password) => {
        const data = await apiRequest<AuthResponse>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password })
        });

        setAuthSession(data.token, data.user);
        setUser(data.user);
        return data.user;
      },
      register: async (name, email, password) => {
        const data = await apiRequest<AuthResponse>("/auth/register", {
          method: "POST",
          body: JSON.stringify({ name, email, password })
        });

        setAuthSession(data.token, data.user);
        setUser(data.user);
        return data.user;
      },
      logout: () => {
        clearAuthSession();
        setUser(null);
      }
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
