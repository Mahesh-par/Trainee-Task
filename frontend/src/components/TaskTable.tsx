import { Pencil, Trash2 } from "lucide-react";

import type { Task } from "../types";
import { StatusBadge } from "./StatusBadge";

type TaskTableProps = {
  tasks: Task[];
  onDelete: (taskId: string) => void;
};

export function TaskTable({ tasks, onDelete }: TaskTableProps) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-soft">
      <div className="border-b border-gray-200 px-5 py-4">
        <h3 className="text-lg font-extrabold text-gray-950">Assigned Tasks</h3>
        <p className="mt-1 text-sm text-gray-500">All active task assignments by trainee.</p>
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
            {tasks.map((task) => (
              <tr key={task.id}>
                <td className="max-w-xs px-5 py-4 text-sm font-bold text-gray-950">
                  {task.title}
                </td>
                <td className="px-5 py-4 text-sm text-gray-600">
                  {task.assignedTo.join(", ")}
                </td>
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
