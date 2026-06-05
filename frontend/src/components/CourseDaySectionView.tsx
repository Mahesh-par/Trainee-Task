import { ExternalLink, Lightbulb, MapPin, ShoppingBag, Target } from "lucide-react";

import type { CourseSection } from "../types";

const variantStyles = {
  default: "border-gray-200 bg-white text-navy-800",
  task: "border-emerald-200 bg-emerald-50 text-emerald-900",
  tips: "border-amber-200 bg-amber-50 text-amber-900",
  shopify: "border-gray-200 bg-white text-navy-800",
  location: "border-gray-200 bg-white text-navy-800"
} as const;

const variantIcons = {
  shopify: ShoppingBag,
  location: MapPin,
  task: Target,
  tips: Lightbulb
} as const;

type CourseDaySectionViewProps = {
  section: CourseSection;
};

export function CourseDaySectionView({ section }: CourseDaySectionViewProps) {
  const variant = section.variant ?? "default";
  const Icon = variantIcons[variant as keyof typeof variantIcons];

  if (section.type === "resources") {
    if ((section.resources ?? []).length === 0) {
      return null;
    }

    return (
      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-soft">
        <h3 className="text-sm font-extrabold uppercase tracking-wide text-navy-800">
          {section.label}
        </h3>
        <ul className="mt-3 space-y-2">
          {(section.resources ?? []).map((resource) => (
            <li key={`${resource.label}-${resource.url}`}>
              {resource.label && resource.url ? (
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-navy-800 hover:underline"
                >
                  {resource.label}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    );
  }

  if (!section.content?.trim()) {
    return null;
  }

  const isHighlight = variant === "task" || variant === "tips";

  return (
    <section
      className={`rounded-lg border p-5 shadow-soft ${variantStyles[variant]}`}
    >
      <div className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide">
        {Icon && <Icon className="h-4 w-4" />}
        {section.label}
      </div>
      <p
        className={`mt-3 text-sm leading-7 ${
          isHighlight ? "font-semibold" : ""
        } ${variant === "task" ? "text-emerald-950" : variant === "tips" ? "text-amber-950" : "text-gray-700"}`}
      >
        {section.content}
      </p>
    </section>
  );
}
