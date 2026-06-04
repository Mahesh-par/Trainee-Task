import { Eye } from "lucide-react";

import type { Trainee } from "../types";
import { DayProgressBar } from "./DayProgressBar";
import { TrainingStatusBadge } from "./TrainingStatusBadge";

type TraineeTableProps = {
  trainees: Trainee[];
  onViewDetails: (trainee: Trainee) => void;
};

export function TraineeTable({ trainees, onViewDetails }: TraineeTableProps) {
  return (
    <section id="trainees" className="rounded-lg border border-gray-200 bg-white shadow-soft">
      <div className="border-b border-gray-200 px-5 py-4">
        <h3 className="text-lg font-extrabold text-gray-950">All Registered Users</h3>
        <p className="mt-1 text-sm text-gray-500">
          Click the eye icon to view each trainee&apos;s saved daily submissions.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[
                "#",
                "Trainee Name",
                "Email",
                "Joining Date",
                "Days Completed",
                "Days Remaining",
                "Progress",
                "Status",
                "Actions"
              ].map((heading) => (
                <th
                  key={heading}
                  className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {trainees.map((trainee, index) => (
              <tr key={trainee.id}>
                <td className="px-5 py-4 text-sm font-bold text-gray-500">{index + 1}</td>
                <td className="px-5 py-4 text-sm font-extrabold text-gray-950">
                  {trainee.name}
                </td>
                <td className="px-5 py-4 text-sm text-gray-600">{trainee.email}</td>
                <td className="px-5 py-4 text-sm text-gray-600">{trainee.joiningDate}</td>
                <td className="px-5 py-4 text-sm font-bold text-gray-800">
                  Day {trainee.daysCompleted ?? 0} / 15
                </td>
                <td className="px-5 py-4 text-sm text-gray-600">
                  {trainee.daysRemaining ?? 15} days left
                </td>
                <td className="px-5 py-4">
                  <DayProgressBar completed={trainee.daysCompleted ?? 0} />
                </td>
                <td className="px-5 py-4">
                  <TrainingStatusBadge status={trainee.status ?? "not_started"} />
                </td>
                <td className="px-5 py-4">
                  <button
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
                    title="View submissions"
                    onClick={() => onViewDetails(trainee)}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
