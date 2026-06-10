import { CourseDayModel } from "../models/course-day.model.js";
import { DaySubmissionModel } from "../models/day-submission.model.js";
import { resolveSectionStyle } from "../utils/section-style.js";
import {
  buildLegacySections,
  normalizeCourseDayRecord,
  syncLegacyFieldsFromSections
} from "../utils/course-sections.js";
import type { CourseSectionInput, ResourceLinkInput } from "../utils/course-sections.js";
import type { CurriculumTrack } from "../constants/curriculum-tracks.js";
import {
  getTotalDays,
  updateTotalDays,
  validateDayInProgram
} from "./program-settings.service.js";
import { ApiError } from "../utils/api-error.js";

export type { ResourceLinkInput };

export type UpsertCourseDayInput = {
  track: CurriculumTrack;
  dayNumber: number;
  title: string;
  sections: CourseSectionInput[];
  isPublished?: boolean;
};

const normalizeResources = (resources: ResourceLinkInput[] = []) => {
  return resources
    .map((resource) => ({
      label: resource.label.trim(),
      url: resource.url.trim()
    }))
    .filter((resource) => resource.label && resource.url);
};

const normalizeSections = (sections: CourseSectionInput[]) => {
  if (!Array.isArray(sections) || sections.length === 0) {
    throw new ApiError(400, "At least one content section is required");
  }

  return sections
    .map((section, index) => {
      const label = section.label?.trim();

      if (!label) {
        throw new ApiError(400, "Every section needs a field name");
      }

      if (section.type !== "text" && section.type !== "resources") {
        throw new ApiError(400, `Invalid section type for "${label}"`);
      }

      const { icon, color } = resolveSectionStyle(section);

      if (section.type === "resources") {
        return {
          id: section.id?.trim() || `section-${index}`,
          label,
          type: "resources" as const,
          order: index,
          resources: normalizeResources(section.resources),
          icon,
          color
        };
      }

      return {
        id: section.id?.trim() || `section-${index}`,
        label,
        type: "text" as const,
        order: index,
        content: String(section.content ?? "").trim(),
        icon,
        color
      };
    });
};

export const getAllCourseDays = async (track: CurriculumTrack, publishedOnly: boolean) => {
  const filter = publishedOnly ? { track, isPublished: true } : { track };
  const courseDays = await CourseDayModel.find(filter).sort({ dayNumber: 1 }).lean();

  return courseDays.map((courseDay) => normalizeCourseDayRecord(courseDay));
};

export const getCourseDayByNumber = async (
  track: CurriculumTrack,
  dayNumber: number,
  publishedOnly: boolean
) => {
  await validateDayInProgram(track, dayNumber);

  const filter = publishedOnly
    ? { track, dayNumber, isPublished: true }
    : { track, dayNumber };

  const courseDay = await CourseDayModel.findOne(filter).lean();

  if (!courseDay) {
    throw new ApiError(404, `Course content for day ${dayNumber} was not found`);
  }

  return normalizeCourseDayRecord(courseDay);
};

export const upsertCourseDay = async (input: UpsertCourseDayInput) => {
  await validateDayInProgram(input.track, input.dayNumber);

  if (!input.title.trim()) {
    throw new ApiError(400, "Title is required");
  }

  const sections = normalizeSections(input.sections);

  if (sections.length === 0) {
    throw new ApiError(400, "Add content to at least one section before saving");
  }

  const legacyFields = syncLegacyFieldsFromSections(sections);

  const courseDay = await CourseDayModel.findOneAndUpdate(
    { track: input.track, dayNumber: input.dayNumber },
    {
      track: input.track,
      dayNumber: input.dayNumber,
      title: input.title.trim(),
      sections,
      ...legacyFields,
      isPublished: input.isPublished ?? true
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true
    }
  ).lean();

  return normalizeCourseDayRecord(courseDay);
};

export const deleteCourseDay = async (track: CurriculumTrack, dayNumber: number) => {
  await validateDayInProgram(track, dayNumber);

  const totalDays = await getTotalDays(track);
  const isLastProgramDay = dayNumber === totalDays;

  if (isLastProgramDay && totalDays > 1) {
    const existingSubmission = await DaySubmissionModel.exists({ track, dayNumber });

    if (existingSubmission) {
      throw new ApiError(
        400,
        `Cannot delete day ${dayNumber} because trainee submissions exist for that day`
      );
    }

    await CourseDayModel.findOneAndDelete({ track, dayNumber });
    const settings = await updateTotalDays(track, totalDays - 1);

    return {
      totalDays: settings.totalDays,
      removedProgramDay: true
    };
  }

  const courseDay = await CourseDayModel.findOneAndDelete({ track, dayNumber });

  if (!courseDay) {
    throw new ApiError(404, `Course content for day ${dayNumber} was not found`);
  }

  return {
    totalDays,
    removedProgramDay: false
  };
};

const defaultCourseDays: UpsertCourseDayInput[] = [
  {
    track: "shopify",
    dayNumber: 1,
    title: "HTML Fundamentals",
    sections: buildLegacySections({
      explanation:
        "HTML is the backbone of web pages. It allows you to structure content like headings, paragraphs, images, links, and forms. Understanding HTML helps you control page structure, accessibility, SEO signals, and how content is rendered inside Shopify theme files.",
      resources: [
        { label: "W3Schools HTML", url: "https://www.w3schools.com/html/" },
        {
          label: "HTML Crash Course",
          url: "https://youtu.be/HD13eq_Pmp8?si=Blm7DRMoug0UeBd9"
        }
      ],
      shopifyApplication:
        "In Shopify, HTML is used in theme files to create page structure and content.",
      shopifyAccessPath:
        "Shopify Admin → Online Store → Themes → Actions → Edit Code → .liquid files",
      dailyTask:
        "Create a sample page with heading, paragraph, image, and link using HTML.",
      developerTips: "Use semantic HTML for better SEO and accessibility."
    }),
    isPublished: true
  },
  {
    track: "shopify",
    dayNumber: 2,
    title: "CSS Fundamentals",
    sections: buildLegacySections({
      explanation:
        "CSS styles your HTML content. It controls colors, fonts, spacing, and layout. In Shopify themes, CSS directly affects storefront branding, readability, mobile layout, and perceived performance.",
      resources: [
        { label: "W3Schools CSS", url: "https://www.w3schools.com/css/" },
        {
          label: "CSS Crash Course",
          url: "https://youtu.be/wRNinF7YQqQ?si=9-GKWYfIlItfLOB2"
        }
      ],
      shopifyApplication:
        "In Shopify, CSS is used to style theme elements like buttons, banners, and text.",
      shopifyAccessPath: "Shopify Admin → Themes → Edit Code → theme.css or style.css",
      dailyTask: "Style your Day 1 HTML page: change colors, fonts, and spacing.",
      developerTips: "Use DevTools to preview changes and test responsiveness."
    }),
    isPublished: true
  }
];

export const seedDefaultCourseDays = async () => {
  const existingCount = await CourseDayModel.countDocuments({ track: "shopify" });

  if (existingCount > 0) {
    return;
  }

  for (const courseDay of defaultCourseDays) {
    await upsertCourseDay(courseDay);
  }

  console.log("Seeded default Shopify course days (Day 1 and Day 2)");
};
