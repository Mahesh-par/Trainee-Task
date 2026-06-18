import { Eye } from "lucide-react";
import { useMemo, useState } from "react";

import { curriculumTrackLabels, curriculumTracks } from "../lib/curriculumTracks";
import type { CurriculumTrack, Trainee } from "../types";
import { DayProgressBar } from "./DayProgressBar";
import { TrainingStatusBadge } from "./TrainingStatusBadge";

type TraineeTableProps = {
  trainees: Trainee[];
  unreadRepliesByTrainee?: Record<string, number>;
  onViewDetails: (trainee: Trainee) => void;
};

export function TraineeTable({
  trainees,
  unreadRepliesByTrainee = {},
  onViewDetails
}: TraineeTableProps) {
  const [roleFilter, setRoleFilter] = useState<CurriculumTrack | "all">("all");
  const filteredTrainees = useMemo(
    () =>
      roleFilter === "all"
        ? trainees
        : trainees.filter((trainee) => (trainee.traineeRole ?? "shopify") === roleFilter),
    [roleFilter, trainees]
  );

  return (
    <section id="trainees" className="rounded-lg border border-gray-200 bg-white shadow-soft">
      <div className="flex flex-col gap-4 border-b border-gray-200 px-5 py-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="text-lg font-extrabold text-gray-950">All Registered Users</h3>
          <p className="mt-1 text-sm text-gray-500">
            Click the eye icon to view each trainee&apos;s saved daily submissions.
          </p>
        </div>
        <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
          Filter by Role
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value as CurriculumTrack | "all")}
            className="mt-2 block min-w-48 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold normal-case tracking-normal text-gray-700"
          >
            <option value="all">All roles</option>
            {curriculumTracks.map((track) => (
              <option key={track} value={track}>
                {curriculumTrackLabels[track]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[
                "#",
                "Trainee Name",
                "Role",
                "Email",
                "Joining Date",
                "Tasks Completed",
                "Tasks Remaining",
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
            {filteredTrainees.map((trainee, index) => (
              <tr key={trainee.id}>
                <td className="px-5 py-4 text-sm font-bold text-gray-500">{index + 1}</td>
                <td className="px-5 py-4 text-sm font-extrabold text-gray-950">
                  {trainee.name}
                </td>
                <td className="px-5 py-4 text-sm font-semibold text-gray-700">
                  {curriculumTrackLabels[trainee.traineeRole ?? "shopify"]}
                </td>
                <td className="px-5 py-4 text-sm text-gray-600">{trainee.email}</td>
                <td className="px-5 py-4 text-sm text-gray-600">{trainee.joiningDate}</td>
                <td className="px-5 py-4 text-sm font-bold text-gray-800">
                  {trainee.daysCompleted ?? 0} / {trainee.totalDays ?? 15}
                </td>
                <td className="px-5 py-4 text-sm text-gray-600">
                  {trainee.daysRemaining ?? trainee.totalDays ?? 15} tasks left
                </td>
                <td className="px-5 py-4">
                  <DayProgressBar
                    completed={trainee.daysCompleted ?? 0}
                    total={trainee.totalDays ?? 15}
                  />
                </td>
                <td className="px-5 py-4">
                  <TrainingStatusBadge status={trainee.status ?? "not_started"} />
                </td>
                <td className="px-5 py-4">
                  <button
                    className="relative flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
                    title="View submissions"
                    onClick={() => onViewDetails(trainee)}
                  >
                    <Eye className="h-4 w-4" />
                    {(unreadRepliesByTrainee[trainee.id] ?? 0) > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-extrabold text-white">
                        {unreadRepliesByTrainee[trainee.id] > 9
                          ? "9+"
                          : unreadRepliesByTrainee[trainee.id]}
                      </span>
                    )}
                  </button>
                </td>
              </tr>
            ))}
            {filteredTrainees.length === 0 && (
              <tr>
                <td colSpan={10} className="px-5 py-8 text-center text-sm font-semibold text-gray-500">
                  No trainees found for this role.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
