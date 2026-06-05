import { Check, Clock, Lock } from "lucide-react";

import type { DayState } from "../types";

type DayTrackerProps = {
  days: Array<{ day: number; state: DayState }>;
  currentDay: number;
  totalDays?: number;
  selectedDay?: number;
  onSelectDay?: (day: number) => void;
};

const dayStyles: Record<DayState, string> = {
  completed: "border-navy-800 bg-navy-800 text-white",
  in_progress: "border-navy-700 bg-white text-navy-900 ring-2 ring-navy-700/20",
  upcoming: "border-gray-300 bg-gray-100 text-gray-400"
};

export function DayTracker({
  days,
  currentDay,
  totalDays = days.length,
  selectedDay,
  onSelectDay
}: DayTrackerProps) {
  const activeDay = selectedDay ?? currentDay;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500">
          {totalDays}-Day Progress
        </h2>
        <span className="text-xs font-semibold text-gray-500">Day {activeDay}</span>
      </div>

      <div className="space-y-2">
        {days.map((item) => {
          const isSelectable = item.state !== "upcoming" && Boolean(onSelectDay);
          const isSelected = activeDay === item.day;

          return (
            <button
              key={item.day}
              type="button"
              disabled={!isSelectable}
              onClick={() => onSelectDay?.(item.day)}
              className={`flex w-full items-center gap-3 rounded-md px-1 py-1 text-left transition ${
                isSelected ? "bg-gray-100" : isSelectable ? "hover:bg-gray-50" : "cursor-default"
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-xs font-bold ${dayStyles[item.state]}`}
                title={`Day ${item.day}`}
              >
                {item.state === "completed" ? (
                  <Check className="h-4 w-4" />
                ) : item.state === "in_progress" ? (
                  <Clock className="h-4 w-4" />
                ) : item.state === "upcoming" ? (
                  <Lock className="h-4 w-4" />
                ) : (
                  item.day
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Day {item.day}</p>
                {item.state === "upcoming" ? (
                  <p className="max-w-36 text-xs leading-4 text-gray-500">
                    Complete the above task to unlock
                  </p>
                ) : (
                  <p className="text-xs capitalize text-gray-500">
                    {item.state.replace("_", " ")}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
