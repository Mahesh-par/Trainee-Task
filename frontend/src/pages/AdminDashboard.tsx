import { CalendarDays, CheckCircle2, FileText, UserCircle, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { StatsCard } from "../components/StatsCard";
import { TraineeDetailModal } from "../components/TraineeDetailModal";
import { TraineeTable } from "../components/TraineeTable";
import { useAuth } from "../context/AuthContext";
import { apiRequest, fetchUnreadReplyCounts, mapTrainee } from "../lib/api";
import type { Trainee } from "../types";

type TraineesResponse = {
  trainees: Parameters<typeof mapTrainee>[0][];
};

type DashboardResponse = {
  dashboard: Array<{
    trainee: Parameters<typeof mapTrainee>[0];
    progress: {
      completionPercentage: number;
      totalTasks: number;
      completedTasks: number;
    };
  }>;
};

export function AdminDashboard() {
  const { user } = useAuth();
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [selectedTrainee, setSelectedTrainee] = useState<Trainee | null>(null);
  const [unreadRepliesByTrainee, setUnreadRepliesByTrainee] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setError("");
    setIsLoading(true);

    try {
      const [traineesData, dashboardData] = await Promise.all([
        apiRequest<TraineesResponse>("/users/trainees"),
        apiRequest<DashboardResponse>("/tasks/dashboard")
      ]);

      const progressByTrainee = new Map(
        dashboardData.dashboard.map((item) => [
          item.trainee._id ?? item.trainee.id ?? "",
          item.progress.completionPercentage
        ])
      );

      setTrainees(
        traineesData.trainees.map((trainee) => {
          const mappedTrainee = mapTrainee(trainee);

          return {
            ...mappedTrainee,
            progress:
              progressByTrainee.get(trainee._id ?? trainee.id ?? "") ?? mappedTrainee.progress
          };
        })
      );

      const [stats, unreadReplies] = await Promise.all([
        apiRequest<{ totalSubmissions: number }>("/submissions/stats"),
        fetchUnreadReplyCounts()
      ]);
      setSubmissionCount(stats.totalSubmissions);
      setUnreadRepliesByTrainee(Object.fromEntries(unreadReplies.entries()));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load dashboard");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const activeTrainees = trainees.filter((trainee) => trainee.status === "active").length;
  const traineesWithProgress = trainees.filter((trainee) => (trainee.progress ?? 0) > 0).length;
  const averageProgress =
    trainees.length === 0
      ? 0
      : Math.round(
          trainees.reduce((total, trainee) => total + (trainee.progress ?? 0), 0) / trainees.length
        );

  return (
    <div>
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white px-5 py-4 lg:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-950">Admin Dashboard</h2>
            <p className="mt-1 text-sm text-gray-500">
              Monitor trainee progress and review daily curriculum submissions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-bold text-gray-950">
                {new Date().toLocaleDateString(undefined, {
                  day: "2-digit",
                  month: "short",
                  year: "numeric"
                })}
              </p>
              <p className="text-xs font-semibold text-gray-500">{user?.name ?? "Admin"}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 bg-gray-50 text-navy-800">
              <UserCircle className="h-5 w-5" />
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-6 px-5 py-6 lg:px-8">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="rounded-lg border border-gray-200 bg-white p-5 text-sm font-semibold text-gray-600 shadow-soft">
            Loading dashboard from database...
          </div>
        )}

        <section id="overview" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            label="Total Registered Users"
            value={trainees.length}
            detail="Trainee accounts in system"
            icon={Users}
          />
          <StatsCard
            label="Currently Active"
            value={activeTrainees}
            detail="Inside the 15-day window"
            icon={CalendarDays}
          />
          <StatsCard
            label="Total Submissions"
            value={submissionCount}
            detail="Saved across all training days"
            icon={FileText}
          />
          <StatsCard
            label="Average Progress"
            value={`${averageProgress}%`}
            detail={`${traineesWithProgress} trainees started`}
            icon={CheckCircle2}
          />
        </section>

        <TraineeTable
          trainees={trainees}
          unreadRepliesByTrainee={unreadRepliesByTrainee}
          onViewDetails={setSelectedTrainee}
        />
      </div>

      <TraineeDetailModal
        trainee={selectedTrainee}
        onClose={() => setSelectedTrainee(null)}
        onRepliesRead={async () => {
          const unreadReplies = await fetchUnreadReplyCounts();
          setUnreadRepliesByTrainee(Object.fromEntries(unreadReplies.entries()));
        }}
        onTraineeUpdated={(updatedTrainee) => {
          setTrainees((current) =>
            current.map((trainee) =>
              trainee.id === updatedTrainee.id ? { ...trainee, ...updatedTrainee } : trainee
            )
          );
          setSelectedTrainee((current) =>
            current?.id === updatedTrainee.id ? { ...current, ...updatedTrainee } : current
          );
        }}
      />
    </div>
  );
}
