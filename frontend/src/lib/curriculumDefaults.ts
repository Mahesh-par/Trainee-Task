import type { CourseDayInput, CourseSection, CourseSectionColor, CourseSectionIcon } from "../types";

export const createSectionId = () =>
  `section-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const createTextSection = (
  label: string,
  order: number,
  content = "",
  icon: CourseSectionIcon = "none",
  color: CourseSectionColor = "default"
): CourseSection => ({
  id: createSectionId(),
  label,
  type: "text",
  order,
  content,
  icon,
  color
});

export const createResourcesSection = (
  label = "Learning Resources",
  order = 1
): CourseSection => ({
  id: createSectionId(),
  label,
  type: "resources",
  order,
  resources: [{ label: "", url: "" }],
  icon: "none",
  color: "default"
});

export const defaultSectionsForNewDay = (): CourseSection[] => [
  createTextSection("Explanation", 0),
  createResourcesSection("Learning Resources", 1),
  createTextSection("How it applies in Shopify", 2, "", "shopping-bag", "default"),
  createTextSection("Where to access in Shopify", 3, "", "map-pin", "rose"),
  createTextSection("Daily Task", 4, "", "target", "emerald"),
  createTextSection("Developer Tips", 5, "", "lightbulb", "amber")
];

export const emptyCourseDayInput = (dayNumber: number): CourseDayInput => ({
  dayNumber,
  title: "",
  sections: defaultSectionsForNewDay(),
  isPublished: false
});

export const courseDayInputFromCourseDay = (
  courseDay: Omit<CourseDayInput, "dayNumber"> & { dayNumber: number }
): CourseDayInput => ({
  dayNumber: courseDay.dayNumber,
  title: courseDay.title,
  isPublished: courseDay.isPublished,
  sections: [...courseDay.sections]
    .sort((left, right) => left.order - right.order)
    .map((section, index) => ({
      ...section,
      order: index,
      resources:
        section.type === "resources"
          ? (section.resources?.length ?? 0) > 0
            ? section.resources!
            : [{ label: "", url: "" }]
          : section.resources
    }))
});

export const courseDayPreviewFromInput = (input: CourseDayInput) => ({
  id: "preview",
  dayNumber: input.dayNumber,
  title: input.title || "Untitled Day",
  sections: input.sections,
  isPublished: input.isPublished
});
