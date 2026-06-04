import { CalendarDays } from "lucide-react";

import type { Task, TaskStatus } from "../types";
import { StatusBadge } from "./StatusBadge";

type TaskCardProps = {
  task: Task;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
};

export function TaskCard({ task, onStatusChange }: TaskCardProps) {
  return (
    <article className="rounded-lg border border-gray-200 bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-extrabold text-gray-950">{task.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-600">
            {task.description}
          </p>
        </div>
        <StatusBadge status={task.status} />
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
          <CalendarDays className="h-4 w-4 text-gray-400" />
          <span>{task.startDate}</span>
          <span>to</span>
          <span>{task.endDate}</span>
        </div>

        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          Status
          <select
            value={task.status}
            onChange={(event) =>
              onStatusChange(task.assignmentId ?? task.id, event.target.value as TaskStatus)
            }
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-800 outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-700/10"
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </label>
      </div>
    </article>
  );
}
