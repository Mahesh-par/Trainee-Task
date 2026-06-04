import { Send } from "lucide-react";
import { FormEvent, useState } from "react";

import type { Trainee } from "../types";

type AssignTaskFormProps = {
  trainees: Trainee[];
  onSubmit: (input: {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    traineeIds: string[];
  }) => Promise<void>;
};

export function AssignTaskForm({ trainees, onSubmit }: AssignTaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [traineeIds, setTraineeIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await onSubmit({ title, description, startDate, endDate, traineeIds });
      setTitle("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      setTraineeIds([]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Task creation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-soft">
      <div className="mb-5">
        <h3 className="text-lg font-extrabold text-gray-950">Create Task Assignment</h3>
        <p className="mt-1 text-sm text-gray-500">Assign one task to one or more trainees.</p>
      </div>

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div>
          <label className="text-sm font-bold text-gray-700" htmlFor="title">
            Task Title
          </label>
          <input
            id="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-2 h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-700/10"
            placeholder="Enter task title"
            required
          />
        </div>

        <div>
          <label className="text-sm font-bold text-gray-700" htmlFor="description">
            Task Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            className="mt-2 w-full resize-none rounded-md border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-700/10"
            placeholder="Describe the task"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-bold text-gray-700" htmlFor="startDate">
              Start Date
            </label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="mt-2 h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-700/10"
              required
            />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700" htmlFor="endDate">
              End Date
            </label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="mt-2 h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-700/10"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-bold text-gray-700" htmlFor="trainees">
            Assign Trainees
          </label>
          <select
            id="trainees"
            multiple
            value={traineeIds}
            onChange={(event) =>
              setTraineeIds(
                Array.from(event.target.selectedOptions, (option) => option.value)
              )
            }
            className="mt-2 h-32 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-700/10"
            required
          >
            {trainees.map((trainee) => (
              <option key={trainee.id} value={trainee.id}>
                {trainee.name}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-navy-900 px-4 text-sm font-bold text-white hover:bg-navy-800"
        >
          <Send className="h-4 w-4" />
          {isSubmitting ? "Assigning..." : "Assign Task"}
        </button>
      </form>
    </section>
  );
}
