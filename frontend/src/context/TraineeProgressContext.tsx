import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

import { useAuth } from "./AuthContext";
import {
  createDayTimelineFromProgress,
  DEFAULT_TOTAL_DAYS,
  fetchTraineeDayProgress
} from "../lib/api";
import type { TraineeDayProgress } from "../types";
import type { DayState } from "../types";

type TraineeProgressContextValue = {
  progress: TraineeDayProgress | null;
  isLoading: boolean;
  dayTimeline: {
    currentDay: number;
    days: Array<{ day: number; state: DayState }>;
  };
  refreshProgress: () => Promise<void>;
};

const defaultProgress: TraineeDayProgress = {
  unlockedDay: 1,
  doneDays: [],
  currentDay: 1,
  programCompleted: false,
  totalDays: DEFAULT_TOTAL_DAYS
};

const TraineeProgressContext = createContext<TraineeProgressContextValue | null>(null);

export function TraineeProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<TraineeDayProgress | null>(null);
  const [isLoading, setIsLoading] = useState(user?.role !== "admin");

  const refreshProgress = useCallback(async () => {
    if (user?.role === "admin") {
      return;
    }

    setIsLoading(true);

    try {
      const nextProgress = await fetchTraineeDayProgress();
      setProgress(nextProgress);
    } catch {
      setProgress(defaultProgress);
    } finally {
      setIsLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    void refreshProgress();
  }, [refreshProgress]);

  useEffect(() => {
    const handleFocus = () => {
      void refreshProgress();
    };

    if (user?.role !== "admin") {
      window.addEventListener("focus", handleFocus);
    }

    return () => window.removeEventListener("focus", handleFocus);
  }, [refreshProgress, user?.role]);

  const dayTimeline = useMemo(
    () => createDayTimelineFromProgress(progress ?? defaultProgress),
    [progress]
  );

  const value = useMemo(
    () => ({
      progress,
      isLoading,
      dayTimeline,
      refreshProgress
    }),
    [progress, isLoading, dayTimeline, refreshProgress]
  );

  return (
    <TraineeProgressContext.Provider value={value}>{children}</TraineeProgressContext.Provider>
  );
}

export const useTraineeProgress = () => {
  const context = useContext(TraineeProgressContext);

  if (!context) {
    return {
      progress: defaultProgress,
      isLoading: false,
      dayTimeline: createDayTimelineFromProgress(defaultProgress),
      refreshProgress: async () => undefined
    };
  }

  return context;
};
