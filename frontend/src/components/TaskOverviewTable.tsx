import { Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import type { Task, TaskStatus } from "../types";
import { StatusBadge } from "./StatusBadge";

type TaskOverviewTableProps = {
  tasks: Task[];
  onDelete: (taskId: string) => void;
};

export function TaskOverviewTable({ tasks, onDelete }: TaskOverviewTableProps) {
  const [traineeFilter, setTraineeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [dateFilter, setDateFilter] = useState("");

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const traineeMatch = task.assignedTo
        .join(" ")
        .toLowerCase()
        .includes(traineeFilter.toLowerCase());
      const statusMatch = statusFilter === "all" || task.status === statusFilter;
      const dateMatch = !dateFilter || task.startDate >= dateFilter;

      return traineeMatch && statusMatch && dateMatch;
    });
  }, [dateFilter, statusFilter, tasks, traineeFilter]);

  return (
    <section id="tasks" className="rounded-lg border border-gray-200 bg-white shadow-soft">
      <div className="border-b border-gray-200 px-5 py-4">
        <h3 className="text-lg font-extrabold text-gray-950">Task Overview</h3>
        <p className="mt-1 text-sm text-gray-500">Every task across all trainees.</p>
      </div>

      <div className="grid gap-3 border-b border-gray-200 px-5 py-4 md:grid-cols-3">
        <input
          value={traineeFilter}
          onChange={(event) => setTraineeFilter(event.target.value)}
          className="h-10 rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-700/10"
          placeholder="Filter by trainee name"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as "all" | TaskStatus)}
          className="h-10 rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-700/10"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={(event) => setDateFilter(event.target.value)}
          className="h-10 rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-700/10"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {["Task Name", "Assigned To", "Start Date", "End Date", "Status", "Actions"].map(
                (heading) => (
                  <th
                    key={heading}
                    className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500"
                  >
                    {heading}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filteredTasks.map((task) => (
              <tr key={task.id}>
                <td className="px-5 py-4 text-sm font-extrabold text-gray-950">{task.title}</td>
                <td className="px-5 py-4 text-sm text-gray-600">{task.assignedTo.join(", ")}</td>
                <td className="px-5 py-4 text-sm text-gray-600">{task.startDate}</td>
                <td className="px-5 py-4 text-sm text-gray-600">{task.endDate}</td>
                <td className="px-5 py-4">
                  <StatusBadge status={task.status} />
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
                      title="Edit task"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
                      title="Delete task"
                      onClick={() => onDelete(task.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
