import { ClipboardCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

type AuthPageProps = {
  mode: "login" | "register" | "admin-login";
};

export function AuthPage({ mode }: AuthPageProps) {
  const isRegister = mode === "register";
  const isAdminLogin = mode === "admin-login";
  const navigate = useNavigate();
  const { login, logout, register, user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) {
    if (isAdminLogin && user.role !== "admin") {
      return <Navigate to="/trainee/course" replace />;
    }

    return <Navigate to={user.role === "admin" ? "/admin" : "/trainee/course"} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const nextUser = isRegister
        ? await register(name, email, password)
        : await login(email, password);

      if (isAdminLogin && nextUser.role !== "admin") {
        logout();
        setError("Only admin accounts can access the admin dashboard");
        return;
      }

      navigate(isAdminLogin ? "/admin" : nextUser.role === "admin" ? "/admin" : "/trainee/course", {
        replace: true
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Authentication failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-10 font-sans">
      <section className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-soft">
        <div className="mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-navy-900 text-white">
            <ClipboardCheck className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold text-gray-950">
            {isRegister
              ? "Create trainee account"
              : isAdminLogin
                ? "Admin dashboard login"
                : "Trainee login"}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {isRegister
              ? "Register a trainee account with name, email, and password."
              : isAdminLogin
                ? "Use an admin account to manage trainees and assignments."
                : "Use your trainee credentials to view assigned tasks."}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {isRegister && (
            <div>
              <label className="text-sm font-bold text-gray-700" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 h-11 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-700/10"
                required
              />
            </div>
          )}

          <div>
            <label className="text-sm font-bold text-gray-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 h-11 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-700/10"
              required
            />
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 h-11 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-700/10"
              required
            />
          </div>

          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-full rounded-md bg-navy-900 text-sm font-bold text-white hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Please wait..." : isRegister ? "Create Account" : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          {isRegister
            ? "Already have an account?"
            : isAdminLogin
              ? "Trainee user?"
              : "Need a trainee account?"}{" "}
          <Link
            to={isRegister ? "/login" : isAdminLogin ? "/login" : "/register"}
            className="font-bold text-navy-800 hover:text-navy-900"
          >
            {isRegister ? "Login" : isAdminLogin ? "Go to trainee login" : "Register"}
          </Link>
        </p>
        {!isRegister && !isAdminLogin && (
          <p className="mt-3 text-center text-sm text-gray-500">
            Admin account?{" "}
            <Link to="/admin-login" className="font-bold text-navy-800 hover:text-navy-900">
              Open admin login
            </Link>
          </p>
        )}
      </section>
    </main>
  );
}
