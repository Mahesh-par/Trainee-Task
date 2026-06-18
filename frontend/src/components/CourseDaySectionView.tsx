import { ExternalLink } from "lucide-react";

import {
  resolveSectionStyle,
  sectionColorStyles,
  sectionIconComponents
} from "../lib/sectionStyle";
import type { CourseSection } from "../types";

type CourseDaySectionViewProps = {
  section: CourseSection;
};

const bulletLinePattern = /^\s*(?:[-*]|•)\s+/;

const splitContentLines = (content: string) =>
  content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const isBulletList = (lines: string[]) =>
  lines.length > 1 && lines.every((line) => bulletLinePattern.test(line));

const cleanBulletLine = (line: string) => line.replace(bulletLinePattern, "").trim();

export function CourseDaySectionView({ section }: CourseDaySectionViewProps) {
  const { icon, color } = resolveSectionStyle(section);
  const styles = sectionColorStyles[color];
  const Icon = icon !== "none" ? sectionIconComponents[icon] : null;

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

  const contentLines = splitContentLines(section.content);
  const textClassName = `text-sm leading-7 ${styles.highlight ? "font-semibold" : ""} ${styles.text}`;

  return (
    <section
      className={`rounded-lg border p-5 shadow-soft ${styles.border} ${styles.bg}`}
    >
      <div className={`flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide ${styles.heading}`}>
        {Icon && <Icon className="h-4 w-4" />}
        {section.label}
      </div>
      {isBulletList(contentLines) ? (
        <ul className={`mt-3 list-disc space-y-1 pl-5 ${textClassName}`}>
          {contentLines.map((line, index) => (
            <li key={`${line}-${index}`}>{cleanBulletLine(line)}</li>
          ))}
        </ul>
      ) : (
        <div className={`mt-3 space-y-2 ${textClassName}`}>
          {contentLines.map((line, index) => (
            <p key={`${line}-${index}`}>{line}</p>
          ))}
        </div>
      )}
    </section>
  );
}
