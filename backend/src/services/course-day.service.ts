import { CourseDayModel } from "../models/course-day.model.js";
import { ApiError } from "../utils/api-error.js";

export type ResourceLinkInput = {
  label: string;
  url: string;
};

export type UpsertCourseDayInput = {
  dayNumber: number;
  title: string;
  explanation: string;
  resources: ResourceLinkInput[];
  shopifyApplication: string;
  shopifyAccessPath: string;
  dailyTask: string;
  developerTips: string;
  isPublished?: boolean;
};

const normalizeResources = (resources: ResourceLinkInput[]) => {
  return resources
    .map((resource) => ({
      label: resource.label.trim(),
      url: resource.url.trim()
    }))
    .filter((resource) => resource.label && resource.url);
};

const validateDayNumber = (dayNumber: number) => {
  if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 15) {
    throw new ApiError(400, "Day number must be between 1 and 15");
  }
};

export const getAllCourseDays = async (publishedOnly: boolean) => {
  const filter = publishedOnly ? { isPublished: true } : {};

  return CourseDayModel.find(filter).sort({ dayNumber: 1 }).lean();
};

export const getCourseDayByNumber = async (dayNumber: number, publishedOnly: boolean) => {
  validateDayNumber(dayNumber);

  const filter = publishedOnly
    ? { dayNumber, isPublished: true }
    : { dayNumber };

  const courseDay = await CourseDayModel.findOne(filter).lean();

  if (!courseDay) {
    throw new ApiError(404, `Course content for day ${dayNumber} was not found`);
  }

  return courseDay;
};

export const upsertCourseDay = async (input: UpsertCourseDayInput) => {
  validateDayNumber(input.dayNumber);

  if (!input.title.trim()) {
    throw new ApiError(400, "Title is required");
  }

  if (!input.explanation.trim()) {
    throw new ApiError(400, "Explanation is required");
  }

  if (!input.shopifyApplication.trim()) {
    throw new ApiError(400, "Shopify application notes are required");
  }

  if (!input.shopifyAccessPath.trim()) {
    throw new ApiError(400, "Shopify access path is required");
  }

  if (!input.dailyTask.trim()) {
    throw new ApiError(400, "Daily task is required");
  }

  if (!input.developerTips.trim()) {
    throw new ApiError(400, "Developer tips are required");
  }

  const courseDay = await CourseDayModel.findOneAndUpdate(
    { dayNumber: input.dayNumber },
    {
      dayNumber: input.dayNumber,
      title: input.title.trim(),
      explanation: input.explanation.trim(),
      resources: normalizeResources(input.resources),
      shopifyApplication: input.shopifyApplication.trim(),
      shopifyAccessPath: input.shopifyAccessPath.trim(),
      dailyTask: input.dailyTask.trim(),
      developerTips: input.developerTips.trim(),
      isPublished: input.isPublished ?? true
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true
    }
  ).lean();

  return courseDay;
};

export const deleteCourseDay = async (dayNumber: number) => {
  validateDayNumber(dayNumber);

  const courseDay = await CourseDayModel.findOneAndDelete({ dayNumber });

  if (!courseDay) {
    throw new ApiError(404, `Course content for day ${dayNumber} was not found`);
  }
};

const defaultCourseDays: UpsertCourseDayInput[] = [
  {
    dayNumber: 1,
    title: "HTML Fundamentals",
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
    developerTips: "Use semantic HTML for better SEO and accessibility.",
    isPublished: true
  },
  {
    dayNumber: 2,
    title: "CSS Fundamentals",
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
    developerTips: "Use DevTools to preview changes and test responsiveness.",
    isPublished: true
  }
];

export const seedDefaultCourseDays = async () => {
  const existingCount = await CourseDayModel.countDocuments();

  if (existingCount > 0) {
    return;
  }

  for (const courseDay of defaultCourseDays) {
    await upsertCourseDay(courseDay);
  }

  console.log("Seeded default course days (Day 1 and Day 2)");
};
