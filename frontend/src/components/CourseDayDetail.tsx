import { ExternalLink, Lightbulb, MapPin, ShoppingBag, Target } from "lucide-react";

import type { CourseDay } from "../types";

type CourseDayDetailProps = {
  courseDay: CourseDay;
};

export function CourseDayDetail({ courseDay }: CourseDayDetailProps) {
  return (
    <article className="space-y-6">
      <header className="rounded-lg border border-navy-800/10 bg-navy-900 px-5 py-5 text-white shadow-soft">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-300">
          Day {courseDay.dayNumber}
        </p>
        <h2 className="mt-2 text-2xl font-extrabold">{courseDay.title}</h2>
      </header>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-soft">
        <h3 className="text-sm font-extrabold uppercase tracking-wide text-navy-800">
          Explanation
        </h3>
        <p className="mt-3 text-sm leading-7 text-gray-700">{courseDay.explanation}</p>
      </section>

      {courseDay.resources.length > 0 && (
        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-soft">
          <h3 className="text-sm font-extrabold uppercase tracking-wide text-navy-800">
            Learning Resources
          </h3>
          <ul className="mt-3 space-y-2">
            {courseDay.resources.map((resource) => (
              <li key={`${resource.label}-${resource.url}`}>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-navy-800 hover:underline"
                >
                  {resource.label}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-soft">
        <div className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-navy-800">
          <ShoppingBag className="h-4 w-4" />
          How it applies in Shopify
        </div>
        <p className="mt-3 text-sm leading-7 text-gray-700">{courseDay.shopifyApplication}</p>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-soft">
        <div className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-navy-800">
          <MapPin className="h-4 w-4" />
          Where to access in Shopify
        </div>
        <p className="mt-3 text-sm leading-7 text-gray-700">{courseDay.shopifyAccessPath}</p>
      </section>

      <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 shadow-soft">
        <div className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-emerald-900">
          <Target className="h-4 w-4" />
          Daily Task
        </div>
        <p className="mt-3 text-sm font-semibold leading-7 text-emerald-950">{courseDay.dailyTask}</p>
      </section>

      <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-soft">
        <div className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-amber-900">
          <Lightbulb className="h-4 w-4" />
          Developer Tips
        </div>
        <p className="mt-3 text-sm leading-7 text-amber-950">{courseDay.developerTips}</p>
      </section>
    </article>
  );
}
