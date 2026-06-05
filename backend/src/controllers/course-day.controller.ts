import type { Request, Response } from "express";

import {
  deleteCourseDay,
  getAllCourseDays,
  getCourseDayByNumber,
  upsertCourseDay
} from "../services/course-day.service.js";
import type { UpsertCourseDayInput } from "../services/course-day.service.js";
import type { CourseSectionInput } from "../utils/course-sections.js";
import {
  courseSectionTypes,
  courseSectionVariants,
  type CourseSectionVariant
} from "../models/course-day.model.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";

const getRouteParam = (value: string | string[] | undefined, name: string) => {
  if (!value || Array.isArray(value)) {
    throw new ApiError(400, `${name} is required`);
  }

  return value;
};

const parseSections = (sections: unknown): CourseSectionInput[] => {
  if (!Array.isArray(sections)) {
    return [];
  }

  return sections
    .filter((section): section is Record<string, unknown> => typeof section === "object" && section !== null)
    .map((section, index) => ({
      id: String(section.id ?? `section-${index}`),
      label: String(section.label ?? ""),
      type: courseSectionTypes.includes(section.type as CourseSectionInput["type"])
        ? (section.type as CourseSectionInput["type"])
        : "text",
      order: Number(section.order ?? index),
      content: String(section.content ?? ""),
      resources: Array.isArray(section.resources)
        ? section.resources
            .filter(
              (resource): resource is { label: string; url: string } =>
                typeof resource === "object" &&
                resource !== null &&
                "label" in resource &&
                "url" in resource
            )
            .map((resource) => ({
              label: String(resource.label),
              url: String(resource.url)
            }))
        : [],
      variant: courseSectionVariants.includes(section.variant as CourseSectionVariant)
        ? (section.variant as CourseSectionVariant)
        : "default"
    }));
};

const parseCourseDayBody = (body: Record<string, unknown>): UpsertCourseDayInput => {
  const dayNumber = Number(body.dayNumber);

  if (Number.isNaN(dayNumber)) {
    throw new ApiError(400, "Day number must be a valid number");
  }

  return {
    dayNumber,
    title: String(body.title ?? ""),
    sections: parseSections(body.sections),
    isPublished: body.isPublished === undefined ? true : Boolean(body.isPublished)
  };
};

export const listCourseDaysHandler = asyncHandler(async (request: Request, response: Response) => {
  const publishedOnly = request.user?.role !== "admin";
  const courseDays = await getAllCourseDays(publishedOnly);

  response.status(200).json({
    success: true,
    message: "Course days fetched successfully",
    data: { courseDays }
  });
});

export const getCourseDayHandler = asyncHandler(async (request: Request, response: Response) => {
  const dayNumber = Number(getRouteParam(request.params.dayNumber, "Day number"));
  const publishedOnly = request.user?.role !== "admin";
  const courseDay = await getCourseDayByNumber(dayNumber, publishedOnly);

  response.status(200).json({
    success: true,
    message: "Course day fetched successfully",
    data: { courseDay }
  });
});

export const upsertCourseDayHandler = asyncHandler(async (request: Request, response: Response) => {
  const input = parseCourseDayBody(request.body as Record<string, unknown>);
  const courseDay = await upsertCourseDay(input);

  response.status(200).json({
    success: true,
    message: "Course day saved successfully",
    data: { courseDay }
  });
});

export const deleteCourseDayHandler = asyncHandler(async (request: Request, response: Response) => {
  const dayNumber = Number(getRouteParam(request.params.dayNumber, "Day number"));
  await deleteCourseDay(dayNumber);

  response.status(200).json({
    success: true,
    message: "Course day deleted successfully",
    data: null
  });
});
