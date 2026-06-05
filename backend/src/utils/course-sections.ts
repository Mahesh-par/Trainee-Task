import type { CourseSectionVariant } from "../models/course-day.model.js";
import { resolveSectionStyle } from "./section-style.js";

export type ResourceLinkInput = {
  label: string;
  url: string;
};

export type CourseSectionInput = {
  id: string;
  label: string;
  type: "text" | "resources";
  order: number;
  content?: string;
  resources?: ResourceLinkInput[];
  variant?: CourseSectionVariant;
  icon?: string;
  color?: string;
};

type LegacyCourseDay = {
  explanation?: string;
  resources?: ResourceLinkInput[];
  shopifyApplication?: string;
  shopifyAccessPath?: string;
  dailyTask?: string;
  developerTips?: string;
  sections?: CourseSectionInput[];
};

export const buildLegacySections = (courseDay: LegacyCourseDay): CourseSectionInput[] => {
  if (courseDay.sections && courseDay.sections.length > 0) {
    return [...courseDay.sections].sort((left, right) => left.order - right.order);
  }

  return [
    {
      id: "explanation",
      label: "Explanation",
      type: "text",
      order: 0,
      content: courseDay.explanation ?? "",
      variant: "default"
    },
    {
      id: "resources",
      label: "Learning Resources",
      type: "resources",
      order: 1,
      resources: courseDay.resources ?? [],
      variant: "default"
    },
    {
      id: "shopify-application",
      label: "How it applies in Shopify",
      type: "text",
      order: 2,
      content: courseDay.shopifyApplication ?? "",
      variant: "shopify"
    },
    {
      id: "shopify-access",
      label: "Where to access in Shopify",
      type: "text",
      order: 3,
      content: courseDay.shopifyAccessPath ?? "",
      variant: "location"
    },
    {
      id: "daily-task",
      label: "Daily Task",
      type: "text",
      order: 4,
      content: courseDay.dailyTask ?? "",
      variant: "task"
    },
    {
      id: "developer-tips",
      label: "Developer Tips",
      type: "text",
      order: 5,
      content: courseDay.developerTips ?? "",
      variant: "tips"
    }
  ];
};

export const syncLegacyFieldsFromSections = (sections: CourseSectionInput[]) => {
  const findText = (matcher: (label: string) => boolean) =>
    sections.find((section) => section.type === "text" && matcher(section.label.toLowerCase()))
      ?.content ?? "";

  const resourceSection =
    sections.find((section) => section.type === "resources") ??
    sections.find((section) => section.label.toLowerCase().includes("resource"));

  return {
    explanation: findText((label) => label.includes("explanation")) || sections.find((s) => s.type === "text")?.content || "",
    resources: resourceSection?.resources ?? [],
    shopifyApplication: findText((label) => label.includes("how it applies")),
    shopifyAccessPath: findText((label) => label.includes("where to access")),
    dailyTask: findText((label) => label.includes("daily task")),
    developerTips: findText((label) => label.includes("developer") || label.includes("tips"))
  };
};

const enrichSectionStyle = (section: CourseSectionInput): CourseSectionInput => {
  const { icon, color } = resolveSectionStyle(section);

  return {
    ...section,
    icon,
    color
  };
};

export const normalizeCourseDayRecord = <T extends LegacyCourseDay>(courseDay: T) => {
  const sections = buildLegacySections(courseDay).map(enrichSectionStyle);

  return {
    ...courseDay,
    sections
  };
};
