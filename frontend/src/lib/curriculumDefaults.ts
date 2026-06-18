import type {
  CourseDayInput,
  CourseSection,
  CourseSectionColor,
  CourseSectionIcon,
  CurriculumTrack
} from "../types";

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

const trackApplicationLabels: Record<CurriculumTrack, string> = {
  webflow: "How it applies in Webflow",
  wordpress: "How it applies in WordPress",
  shopify: "How it applies in Shopify",
  "ui-ux": "How it applies in UI/UX projects",
  testing: "How it applies in testing workflows",
  squarespace: "How it applies in Squarespace",
  wix: "How it applies in Wix"
};

const trackAccessLabels: Record<CurriculumTrack, string> = {
  webflow: "Where to access in Webflow",
  wordpress: "Where to access in WordPress",
  shopify: "Where to access in Shopify",
  "ui-ux": "Where to apply in design tools",
  testing: "Where to apply in your test suite",
  squarespace: "Where to access in Squarespace",
  wix: "Where to access in Wix"
};

export const defaultSectionsForNewDay = (track: CurriculumTrack = "shopify"): CourseSection[] => [
  createTextSection("Explanation", 0),
  createResourcesSection("Learning Resources", 1),
  createTextSection(trackApplicationLabels[track], 2, "", "shopping-bag", "default"),
  createTextSection(trackAccessLabels[track], 3, "", "map-pin", "rose"),
  createTextSection("Daily Task", 4, "", "target", "emerald"),
  createTextSection("Developer Tips", 5, "", "lightbulb", "amber")
];

export const emptyCourseDayInput = (
  dayNumber: number,
  track: CurriculumTrack = "shopify"
): CourseDayInput => ({
  dayNumber,
  title: "",
  sections: defaultSectionsForNewDay(track),
  isPublished: true
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
