import { CheckCircle2, ClipboardList, Clock3 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Header } from "../components/Header";
import { ProgressBar } from "../components/ProgressBar";
import { StatsCard } from "../components/StatsCard";
import { TaskCard } from "../components/TaskCard";
import { useAuth } from "../context/AuthContext";
import { apiRequest, mapTraineeTask } from "../lib/api";
import type { Task, TaskStatus } from "../types";

type MyTasksResponse = {
  tasks: Parameters<typeof mapTraineeTask>[0][];
};

export function TraineeDashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTasks = useCallback(async () => {
    setError("");
    setIsLoading(true);

    try {
      const data = await apiRequest<MyTasksResponse>("/tasks/my-tasks");
      setTasks(data.tasks.map(mapTraineeTask));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const completedTasks = tasks.filter((task) => task.status === "completed").length;
  const inProgressTasks = tasks.filter((task) => task.status === "in_progress").length;
  const pendingTasks = tasks.filter((task) => task.status === "pending").length;
  const completion = useMemo(
    () => Math.round((completedTasks / Math.max(tasks.length, 1)) * 100),
    [completedTasks, tasks.length]
  );

  const handleStatusChange = async (assignmentId: string, status: TaskStatus) => {
    await apiRequest(`/tasks/assignments/${assignmentId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });

    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.assignmentId === assignmentId ? { ...task, status } : task
      )
    );
  };

  return (
    <div>
      <Header
        name={user?.name ?? "Trainee"}
        role="Trainee"
        title="Trainee Dashboard"
        subtitle="Review assignments, update task status, and track training completion."
      />

      <div className="space-y-6 px-5 py-6 lg:px-8">
        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-soft">
          <ProgressBar value={completion} />
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <StatsCard
            label="Assigned Tasks"
            value={tasks.length}
            detail="Tasks currently assigned"
            icon={ClipboardList}
          />
          <StatsCard
            label="In Progress"
            value={inProgressTasks}
            detail="Tasks under active work"
            icon={Clock3}
          />
          <StatsCard
            label="Completed"
            value={completedTasks}
            detail={`${pendingTasks} pending tasks remaining`}
            icon={CheckCircle2}
          />
        </section>

        <section>
          <div className="mb-4">
            <h3 className="text-lg font-extrabold text-gray-950">My Tasks</h3>
            <p className="mt-1 text-sm text-gray-500">
              Update each assignment as work moves from pending to completed.
            </p>
          </div>

          {error && (
            <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {error}
            </p>
          )}

          {isLoading ? (
            <p className="rounded-lg border border-gray-200 bg-white p-5 text-sm font-semibold text-gray-600 shadow-soft">
              Loading assigned tasks...
            </p>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {tasks.map((task) => (
                <TaskCard key={task.assignmentId ?? task.id} task={task} onStatusChange={handleStatusChange} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
