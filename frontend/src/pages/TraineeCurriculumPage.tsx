import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { CourseDayDetail } from "../components/CourseDayDetail";
import { CourseDaySubmission } from "../components/CourseDaySubmission";
import { Header } from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { useTraineeProgress } from "../context/TraineeProgressContext";
import { apiRequest, mapCourseDay } from "../lib/api";
import { curriculumTrackLabels, DEFAULT_CURRICULUM_TRACK } from "../lib/curriculumTracks";
import type { CourseDay } from "../types";

type CourseDaysResponse = {
  courseDays: Parameters<typeof mapCourseDay>[0][];
};

export function TraineeCurriculumPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [courseDays, setCourseDays] = useState<CourseDay[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const { dayTimeline, progress, refreshProgress } = useTraineeProgress();
  const requestedDay = Number(searchParams.get("day"));
  const maxAccessibleDay = progress?.programCompleted
    ? (progress?.totalDays ?? 15)
    : (progress?.unlockedDay ?? 1);

  const loadCourseDays = useCallback(async () => {
    setError("");
    setIsLoading(true);

    try {
      const data = await apiRequest<CourseDaysResponse>("/course-days");
      setCourseDays(data.courseDays.map(mapCourseDay));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load curriculum");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCourseDays();
  }, [loadCourseDays]);

  useEffect(() => {
    void refreshProgress();
  }, [refreshProgress]);

  const courseDayByNumber = useMemo(
    () => new Map(courseDays.map((courseDay) => [courseDay.dayNumber, courseDay])),
    [courseDays]
  );

  const selectedDay = useMemo(() => {
    if (
      Number.isInteger(requestedDay) &&
      requestedDay >= 1 &&
      requestedDay <= maxAccessibleDay &&
      courseDayByNumber.has(requestedDay)
    ) {
      return requestedDay;
    }

    const currentDayContent = courseDayByNumber.get(dayTimeline.currentDay);

    if (currentDayContent) {
      return dayTimeline.currentDay;
    }

    return courseDays[0]?.dayNumber ?? dayTimeline.currentDay;
  }, [requestedDay, courseDayByNumber, dayTimeline.currentDay, courseDays, maxAccessibleDay]);

  const selectedCourseDay = courseDayByNumber.get(selectedDay) ?? null;
  const traineeRoleLabel =
    curriculumTrackLabels[user?.traineeRole ?? DEFAULT_CURRICULUM_TRACK];

  return (
    <div>
      <Header
        name={user?.name ?? "Trainee"}
        role={traineeRoleLabel}
        title="Daily Curriculum"
        subtitle={`Follow your ${traineeRoleLabel} training curriculum day by day.`}
      />

      <div className="space-y-6 px-5 py-6 lg:px-8">
        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}

        {isLoading ? (
          <p className="rounded-lg border border-gray-200 bg-white p-5 text-sm font-semibold text-gray-600 shadow-soft">
            Loading daily curriculum...
          </p>
        ) : selectedCourseDay ? (
          <div className="space-y-6">
            <CourseDayDetail courseDay={selectedCourseDay} />
            <CourseDaySubmission dayNumber={selectedCourseDay.dayNumber} />
          </div>
        ) : (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm font-semibold text-amber-900 shadow-soft">
            Day {selectedDay} content has not been published by admin yet. Check back soon.
          </p>
        )}
      </div>
    </div>
  );
}
