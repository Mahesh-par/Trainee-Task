import { BookOpen, Plus, Trash2, UserCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useParams } from "react-router-dom";

import { ConfirmDialog } from "../components/ConfirmDialog";
import { CourseDayDetail } from "../components/CourseDayDetail";
import { CourseDayEditor } from "../components/CourseDayEditor";
import { useAuth } from "../context/AuthContext";
import {
  apiRequest,
  DEFAULT_TOTAL_DAYS,
  fetchProgramSettings,
  mapCourseDay,
  updateProgramSettings
} from "../lib/api";
import {
  courseDayInputFromCourseDay,
  courseDayPreviewFromInput,
  emptyCourseDayInput
} from "../lib/curriculumDefaults";
import {
  curriculumTrackLabels,
  DEFAULT_CURRICULUM_TRACK,
  isCurriculumTrack,
  type CurriculumTrack
} from "../lib/curriculumTracks";
import type { CourseDay, CourseDayInput } from "../types";

type CourseDaysResponse = {
  courseDays: Parameters<typeof mapCourseDay>[0][];
};

type ConfirmDialogState = {
  title: string;
  description: string;
  confirmLabel: string;
  action: () => Promise<void>;
};

const trackQuery = (track: CurriculumTrack) => `?track=${encodeURIComponent(track)}`;

type AdminCurriculumEditorProps = {
  track: CurriculumTrack;
};

function AdminCurriculumEditor({ track }: AdminCurriculumEditorProps) {
  const { user } = useAuth();
  const [courseDays, setCourseDays] = useState<CourseDay[]>([]);
  const [totalDays, setTotalDays] = useState(DEFAULT_TOTAL_DAYS);
  const [daysToAdd, setDaysToAdd] = useState(1);
  const [selectedDay, setSelectedDay] = useState(1);
  const [formValue, setFormValue] = useState<CourseDayInput>(
    emptyCourseDayInput(1, DEFAULT_CURRICULUM_TRACK)
  );
  const [notification, setNotification] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingDays, setIsUpdatingDays] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const trackLabel = curriculumTrackLabels[track];

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
      const [data, settings] = await Promise.all([
        apiRequest<CourseDaysResponse>(`/course-days${trackQuery(track)}`),
        fetchProgramSettings(track)
      ]);
      setCourseDays(data.courseDays.map(mapCourseDay));
      setTotalDays(settings.totalDays);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load curriculum");
    } finally {
      setIsLoading(false);
    }
  }, [track]);

  useEffect(() => {
    void loadCourseDays();
  }, [loadCourseDays]);

  useEffect(() => {
    if (selectedCourseDay) {
      setFormValue(courseDayInputFromCourseDay(selectedCourseDay));
      return;
    }

    setFormValue(emptyCourseDayInput(selectedDay, track));
  }, [selectedCourseDay, selectedDay, track]);

  const showNotification = (message: string) => {
    setNotification(message);
    window.setTimeout(() => setNotification(""), 2500);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");

    try {
      await apiRequest(`/course-days${trackQuery(track)}`, {
        method: "PUT",
        body: JSON.stringify({ ...formValue, track })
      });
      await loadCourseDays();
      showNotification(`Day ${formValue.dayNumber} content saved.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to save day content");
    } finally {
      setIsSaving(false);
    }
  };

  const requestDeletePage = () => {
    if (selectedCourseDay) {
      setConfirmDialog({
        title: `Delete Day ${selectedDay} page?`,
        description: `This will permanently remove all saved content for "${selectedCourseDay.title}". Trainees will no longer see this day until you publish new content.`,
        confirmLabel: "Delete Page",
        action: async () => {
          setIsSaving(true);
          setError("");

          try {
            await apiRequest(`/course-days/${selectedDay}${trackQuery(track)}`, {
              method: "DELETE"
            });
            await loadCourseDays();
            setFormValue(emptyCourseDayInput(selectedDay, track));
            showNotification(`Day ${selectedDay} content deleted.`);
          } catch (requestError) {
            setError(
              requestError instanceof Error ? requestError.message : "Failed to delete day content"
            );
            throw requestError;
          } finally {
            setIsSaving(false);
          }
        }
      });
      return;
    }

    setConfirmDialog({
      title: `Clear Day ${selectedDay} draft?`,
      description:
        "This page has not been saved yet. Clearing it will reset the topic title, sections, and unpublished changes for this day.",
      confirmLabel: "Clear Page",
      action: async () => {
        setFormValue(emptyCourseDayInput(selectedDay, track));
        showNotification(`Day ${selectedDay} draft cleared.`);
      }
    });
  };

  const handleConfirmDialog = async () => {
    if (!confirmDialog) {
      return;
    }

    setIsConfirming(true);

    try {
      await confirmDialog.action();
      setConfirmDialog(null);
    } catch {
      // Keep the dialog open when the action fails.
    } finally {
      setIsConfirming(false);
    }
  };

  const handleAddDays = async () => {
    const addCount = Math.max(1, Math.floor(daysToAdd));

    if (totalDays + addCount > 365) {
      setError("Program length cannot exceed 365 days.");
      return;
    }

    setIsUpdatingDays(true);
    setError("");

    try {
      const settings = await updateProgramSettings(totalDays + addCount, track);
      setTotalDays(settings.totalDays);
      showNotification(`Program extended to ${settings.totalDays} days.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to add days");
    } finally {
      setIsUpdatingDays(false);
    }
  };

  return (
    <div>
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white px-5 py-4 lg:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-950">{trackLabel} Curriculum</h2>
            <p className="mt-1 text-sm text-gray-500">
              Drag sections to set priority, rename fields, and add custom blocks for each day.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-navy-800" />
            <div className="text-right">
              <p className="text-sm font-bold text-gray-950">{user?.name ?? "Admin"}</p>
              <p className="text-xs font-semibold text-gray-500">{totalDays}-day program</p>
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
                {Array.from({ length: totalDays }, (_, index) => {
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

              <div className="mt-4 border-t border-gray-100 pt-4">
                <p className="text-xs font-extrabold uppercase tracking-wide text-gray-500">
                  Program Length
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-800">
                  Currently {totalDays} training days
                </p>
                <div className="mt-3 flex items-end gap-2">
                  <label className="min-w-0 flex-1 text-xs font-bold text-gray-600">
                    Days to add
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={daysToAdd}
                      onChange={(event) => setDaysToAdd(Math.max(1, Number(event.target.value) || 1))}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => void handleAddDays()}
                    disabled={isUpdatingDays}
                    className="inline-flex shrink-0 items-center gap-1 rounded-md bg-navy-900 px-3 py-2 text-xs font-bold text-white hover:bg-navy-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {isUpdatingDays ? "Adding..." : "Add Days"}
                  </button>
                </div>
              </div>

              <p className="mt-4 text-xs leading-5 text-gray-500">
                Green days already have saved content. Select a day, drag sections, and publish.
              </p>
            </aside>

            <div className="grid gap-6 xl:grid-cols-2">
              <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-extrabold text-gray-950">
                    Edit Day {selectedDay}
                    {selectedCourseDay ? `: ${selectedCourseDay.title}` : ""}
                  </h3>
                  <button
                    type="button"
                    onClick={requestDeletePage}
                    disabled={isSaving || isConfirming}
                    className="inline-flex shrink-0 items-center gap-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Page
                  </button>
                </div>
                <div className="mt-4">
                  <CourseDayEditor
                    value={formValue}
                    onChange={setFormValue}
                    onSubmit={handleSave}
                    isSaving={isSaving}
                    hasExistingContent={Boolean(selectedCourseDay)}
                    maxDayNumber={totalDays}
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

      <ConfirmDialog
        open={Boolean(confirmDialog)}
        title={confirmDialog?.title ?? ""}
        description={confirmDialog?.description ?? ""}
        confirmLabel={confirmDialog?.confirmLabel ?? "Confirm"}
        isLoading={isConfirming}
        onCancel={() => {
          if (!isConfirming) {
            setConfirmDialog(null);
          }
        }}
        onConfirm={() => void handleConfirmDialog()}
      />
    </div>
  );
}

export function AdminCurriculumPage() {
  const { track: trackParam } = useParams();

  if (!trackParam || !isCurriculumTrack(trackParam)) {
    return <Navigate to={`/admin/curriculum/${DEFAULT_CURRICULUM_TRACK}`} replace />;
  }

  return <AdminCurriculumEditor track={trackParam} />;
}
