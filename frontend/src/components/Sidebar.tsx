import {
  BarChart3,
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  UserCircle,
  X
} from "lucide-react";
import { NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useTraineeProgress } from "../context/TraineeProgressContext";
import { createDayTimeline } from "../lib/api";
import { DayTracker } from "./DayTracker";

const navLinks = [
  { label: "Daily Curriculum", to: "/trainee/course", icon: BookOpen },
  { label: "My Assignments", to: "/trainee/assignments", icon: ClipboardList },
  { label: "Admin Dashboard", to: "/admin", icon: BarChart3, end: true },
  { label: "Curriculum Editor", to: "/admin/curriculum", icon: BookOpen }
];

const adminLinks = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard, end: true },
  { label: "Curriculum Editor", to: "/admin/curriculum", icon: BookOpen }
];

const labelTransition =
  "overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]";

type SidebarProps = {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
};

export function Sidebar({
  isCollapsed,
  isMobileOpen,
  onCloseMobile,
  onToggleCollapse
}: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { logout, user } = useAuth();
  const visibleLinks = navLinks.filter((link) => {
    if (link.to.startsWith("/admin")) {
      return user?.role === "admin";
    }

    return user?.role !== "admin" || link.to.startsWith("/trainee");
  });
  const { dayTimeline: progressTimeline } = useTraineeProgress();
  const dayTimeline =
    user?.role === "admin" ? createDayTimeline(user?.createdAt) : progressTimeline;
  const selectedDay = Number(searchParams.get("day")) || dayTimeline.currentDay;
  const userInitials =
    user?.name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "TT";
  const welcomeName = user?.name?.trim().split(/\s+/)[0] ?? "Trainee";

  const handleSelectDay = (day: number) => {
    const timelineDay = dayTimeline.days.find((item) => item.day === day);

    if (!timelineDay || timelineDay.state === "upcoming") {
      return;
    }

    if (location.pathname === "/trainee/course") {
      setSearchParams({ day: String(day) });
      return;
    }

    navigate(`/trainee/course?day=${day}`);
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  if (isCollapsed) {
    const collapsedLinks = user?.role === "admin" ? adminLinks : visibleLinks;

    return (
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-20 overflow-hidden bg-navy-900 px-3 py-6 text-white shadow-soft transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:z-20 lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full min-h-0 w-full flex-col items-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-sm font-extrabold text-navy-900">
              {userInitials}
            </div>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-gray-200 hover:bg-white/10 hover:text-white"
              onClick={onToggleCollapse}
              title="Open sidebar"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          </div>

          <nav className="mt-8 flex min-h-0 flex-1 flex-col items-center gap-3 overflow-y-auto scrollbar-thin">
            {collapsedLinks.map((link) => {
              const Icon = link.icon;

              if ("to" in link && link.to) {
                return (
                  <NavLink
                    key={link.label}
                    to={link.to}
                    end={"end" in link ? link.end : false}
                    className={({ isActive }) =>
                      `flex h-10 w-10 items-center justify-center rounded-md transition ${
                        isActive
                          ? "bg-white text-navy-900"
                          : "text-gray-200 hover:bg-white/10 hover:text-white"
                      }`
                    }
                    title={link.label}
                  >
                    <Icon className="h-4 w-4" />
                  </NavLink>
                );
              }

              return null;
            })}
          </nav>

          <button
            className="mt-6 flex h-10 w-10 items-center justify-center rounded-md border border-white/10 text-gray-200 hover:bg-white/10 hover:text-white"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>
    );
  }

  if (user?.role === "admin") {
    return (
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex overflow-hidden bg-navy-900 px-4 py-6 text-white shadow-soft transition-[width,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:z-20 lg:flex-col ${
          isCollapsed ? "lg:w-20" : "lg:w-72"
        } ${isMobileOpen ? "w-72 translate-x-0" : "w-72 -translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex h-full min-h-0 w-full flex-col">
        <div
          className={`mb-8 flex gap-3 ${
            isCollapsed ? "flex-col items-center" : "items-start justify-between"
          }`}
        >
          <div className="min-w-0">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/20 bg-white text-lg font-extrabold text-navy-900">
            {userInitials}
          </div>
          <div
            className={`${labelTransition} ${
              isCollapsed
                ? "max-w-0 opacity-0 -translate-x-2"
                : "max-w-48 opacity-100 translate-x-0"
            }`}
          >
            <h1 className="mt-4 text-lg font-extrabold">Welcome {welcomeName}</h1>
            <p className="text-sm text-gray-300">Admin Console</p>
          </div>
          </div>
          <button
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 text-gray-200 hover:bg-white/10 lg:flex"
            onClick={onToggleCollapse}
            title={isCollapsed ? "Open sidebar" : "Close sidebar"}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-gray-200 hover:bg-white/10 lg:hidden"
            onClick={onCloseMobile}
            title="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1 scrollbar-thin">
          {adminLinks.map((link) => {
            const Icon = link.icon;

            if (link.to) {
              return (
                <NavLink
                  key={link.label}
                  to={link.to}
                  end={"end" in link ? link.end : false}
                  className={({ isActive }) =>
                    `flex h-11 items-center rounded-md px-3 text-sm font-semibold transition ${
                      isActive
                        ? "bg-white text-navy-900"
                        : "text-gray-200 hover:bg-white/10 hover:text-white"
                    } ${isCollapsed ? "justify-center" : "gap-3"}`
                  }
                  title={link.label}
                >
                  <Icon className="h-4 w-4" />
                  <span
                    className={`${labelTransition} ${
                      isCollapsed
                        ? "max-w-0 opacity-0 -translate-x-2"
                        : "max-w-44 opacity-100 translate-x-0"
                    }`}
                  >
                    {link.label}
                  </span>
                </NavLink>
              );
            }

            return null;
          })}
        </nav>

        <div className="border-t border-white/10 pt-5">
          <button
            className={`flex h-11 w-full items-center rounded-md px-3 text-sm font-semibold text-gray-200 hover:bg-white/10 hover:text-white ${
              isCollapsed ? "justify-center" : "gap-3"
            }`}
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
            <span
              className={`${labelTransition} ${
                isCollapsed
                  ? "max-w-0 opacity-0 -translate-x-2"
                  : "max-w-24 opacity-100 translate-x-0"
              }`}
            >
              Logout
            </span>
          </button>
        </div>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex overflow-hidden border-r border-gray-200 bg-white px-4 py-6 shadow-soft transition-[width,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:z-20 lg:flex-col ${
        isCollapsed ? "lg:w-20" : "lg:w-72"
      } ${isMobileOpen ? "w-72 translate-x-0" : "w-72 -translate-x-full lg:translate-x-0"}`}
    >
      <div className="flex h-full min-h-0 w-full flex-col">
      <div
        className={`mb-8 flex gap-3 ${
          isCollapsed ? "flex-col items-center" : "items-start justify-between"
        }`}
      >
        <div className="min-w-0">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-navy-900 text-lg font-extrabold text-white">
          {userInitials}
        </div>
        <div
          className={`${labelTransition} ${
            isCollapsed
              ? "max-w-0 opacity-0 -translate-x-2"
              : "max-w-48 opacity-100 translate-x-0"
          }`}
        >
          <h1 className="mt-4 text-lg font-extrabold text-gray-950">Welcome {welcomeName}</h1>
        </div>
        </div>
        <button
          className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100 lg:flex"
          onClick={onToggleCollapse}
          title={isCollapsed ? "Open sidebar" : "Close sidebar"}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100 lg:hidden"
          onClick={onCloseMobile}
          title="Close sidebar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1 scrollbar-thin">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            {dayTimeline.days.map((item) => (
              <button
                key={item.day}
                type="button"
                disabled={item.state === "upcoming"}
                onClick={() => handleSelectDay(item.day)}
                className={`flex h-8 w-8 items-center justify-center rounded-md border text-xs font-bold transition ${
                  selectedDay === item.day
                    ? "ring-2 ring-navy-700/30"
                    : ""
                } ${
                  item.state === "completed"
                    ? "border-navy-800 bg-navy-800 text-white"
                    : item.state === "in_progress"
                      ? "border-navy-700 bg-white text-navy-900"
                      : "border-gray-300 bg-gray-100 text-gray-400"
                }`}
                title={`Day ${item.day}`}
              >
                {item.day}
              </button>
            ))}
          </div>
        ) : (
          <DayTracker
            days={dayTimeline.days}
            currentDay={dayTimeline.currentDay}
            selectedDay={location.pathname === "/trainee/course" ? selectedDay : undefined}
            onSelectDay={handleSelectDay}
          />
        )}

        <nav className="mt-8 space-y-1 border-t border-gray-200 pt-5">
          {visibleLinks.map((link) => {
            const Icon = link.icon;

            return (
              <NavLink
                key={link.label}
                to={link.to}
                end={"end" in link ? link.end : false}
                className={({ isActive }) =>
                  `flex h-11 items-center rounded-md px-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-navy-900 text-white"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-950"
                  } ${isCollapsed ? "justify-center" : "gap-3"}`
                }
                title={link.label}
              >
                <Icon className="h-4 w-4" />
                <span
                  className={`${labelTransition} ${
                    isCollapsed
                      ? "max-w-0 opacity-0 -translate-x-2"
                      : "max-w-44 opacity-100 translate-x-0"
                  }`}
                >
                  {link.label}
                </span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <button
        className={`mt-6 flex h-11 items-center rounded-md px-3 text-sm font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-950 ${
          isCollapsed ? "justify-center" : "gap-3"
        }`}
        onClick={handleLogout}
        title="Logout"
      >
        <LogOut className="h-4 w-4" />
        <span
          className={`${labelTransition} ${
            isCollapsed
              ? "max-w-0 opacity-0 -translate-x-2"
              : "max-w-24 opacity-100 translate-x-0"
          }`}
        >
          Logout
        </span>
      </button>
      </div>
    </aside>
  );
}
