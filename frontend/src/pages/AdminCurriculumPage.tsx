import { BookOpen, UserCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CourseDayDetail } from "../components/CourseDayDetail";
import { CourseDayEditor } from "../components/CourseDayEditor";
import { useAuth } from "../context/AuthContext";
import { apiRequest, mapCourseDay } from "../lib/api";
import {
  courseDayInputFromCourseDay,
  courseDayPreviewFromInput,
  emptyCourseDayInput
} from "../lib/curriculumDefaults";
import type { CourseDay, CourseDayInput } from "../types";

type CourseDaysResponse = {
  courseDays: Parameters<typeof mapCourseDay>[0][];
};

export function AdminCurriculumPage() {
  const { user } = useAuth();
  const [courseDays, setCourseDays] = useState<CourseDay[]>([]);
  const [selectedDay, setSelectedDay] = useState(1);
  const [formValue, setFormValue] = useState<CourseDayInput>(emptyCourseDayInput(1));
  const [notification, setNotification] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const courseDayByNumber = useMemo(
    () => new Map(courseDays.map((courseDay) => [courseDay.dayNumber, courseDay])),
    [courseDays]
  );

  const selectedCourseDay = courseDayByNumber.get(selectedDay) ?? null;
  const previewCourseDay = courseDayPreviewFromInput(formValue);

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
    if (selectedCourseDay) {
      setFormValue(courseDayInputFromCourseDay(selectedCourseDay));
      return;
    }

    setFormValue(emptyCourseDayInput(selectedDay));
  }, [selectedCourseDay, selectedDay]);

  const showNotification = (message: string) => {
    setNotification(message);
    window.setTimeout(() => setNotification(""), 2500);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");

    try {
      await apiRequest("/course-days", {
        method: "PUT",
        body: JSON.stringify(formValue)
      });
      await loadCourseDays();
      showNotification(`Day ${formValue.dayNumber} content saved.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to save day content");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCourseDay) {
      return;
    }

    const confirmed = window.confirm(`Delete content for Day ${selectedDay}?`);

    if (!confirmed) {
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await apiRequest(`/course-days/${selectedDay}`, {
        method: "DELETE"
      });
      await loadCourseDays();
      showNotification(`Day ${selectedDay} content deleted.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to delete day content");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white px-5 py-4 lg:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-950">Curriculum Editor</h2>
            <p className="mt-1 text-sm text-gray-500">
              Drag sections to set priority, rename fields, and add custom blocks for each day.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-navy-800" />
            <div className="text-right">
              <p className="text-sm font-bold text-gray-950">{user?.name ?? "Admin"}</p>
              <p className="text-xs font-semibold text-gray-500">15-day program</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 bg-gray-50 text-navy-800">
              <UserCircle className="h-5 w-5" />
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-6 px-5 py-6 lg:px-8">
        {notification && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
            {notification}
          </div>
        )}

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-lg border border-gray-200 bg-white p-5 text-sm font-semibold text-gray-600 shadow-soft">
            Loading curriculum...
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
            <aside className="rounded-lg border border-gray-200 bg-white p-4 shadow-soft">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-gray-500">
                Training Days
              </h3>
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5 xl:grid-cols-3">
                {Array.from({ length: 15 }, (_, index) => {
                  const day = index + 1;
                  const hasContent = courseDayByNumber.has(day);
                  const isSelected = selectedDay === day;

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelectedDay(day)}
                      className={`rounded-md border px-2 py-2 text-sm font-bold transition ${
                        isSelected
                          ? "border-navy-800 bg-navy-900 text-white"
                          : hasContent
                            ? "border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                            : "border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      Day {day}
                    </button>
                  );
                })}
              </div>
              <p className="mt-4 text-xs leading-5 text-gray-500">
                Green days already have saved content. Select a day, drag sections, and publish.
              </p>
            </aside>

            <div className="grid gap-6 xl:grid-cols-2">
              <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-soft">
                <h3 className="text-lg font-extrabold text-gray-950">
                  Edit Day {selectedDay}
                  {selectedCourseDay ? `: ${selectedCourseDay.title}` : ""}
                </h3>
                <div className="mt-4">
                  <CourseDayEditor
                    value={formValue}
                    onChange={setFormValue}
                    onSubmit={handleSave}
                    onDelete={handleDelete}
                    isSaving={isSaving}
                    hasExistingContent={Boolean(selectedCourseDay)}
                  />
                </div>
              </section>

              <section className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-5">
                <h3 className="text-lg font-extrabold text-gray-950">Trainee Preview</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Live preview updates as you edit field names, order, and content.
                </p>
                <div className="mt-4">
                  {formValue.title.trim() ? (
                    <CourseDayDetail courseDay={previewCourseDay} />
                  ) : (
                    <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                      Add a topic title to preview this day.
                    </p>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
