import type { CourseDay } from "../types";
import { CourseDaySectionView } from "./CourseDaySectionView";

type CourseDayDetailProps = {
  courseDay: Pick<CourseDay, "dayNumber" | "title" | "sections">;
};

export function CourseDayDetail({ courseDay }: CourseDayDetailProps) {
  const orderedSections = [...courseDay.sections].sort((left, right) => left.order - right.order);

  return (
    <article className="space-y-6">
      <header className="rounded-lg border border-navy-800/10 bg-navy-900 px-5 py-5 text-white shadow-soft">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-300">
          Day {courseDay.dayNumber}
        </p>
        <h2 className="mt-2 text-2xl font-extrabold">{courseDay.title}</h2>
      </header>

      {orderedSections.map((section) => (
        <CourseDaySectionView key={section.id} section={section} />
      ))}
    </article>
  );
}
