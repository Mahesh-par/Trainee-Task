import type { Request, Response } from "express";

import {
  deleteCourseDay,
  getAllCourseDays,
  getCourseDayByNumber,
  upsertCourseDay
} from "../services/course-day.service.js";
import type { UpsertCourseDayInput } from "../services/course-day.service.js";
import type { CourseSectionInput } from "../utils/course-sections.js";
import { courseSectionTypes } from "../models/course-day.model.js";
import { resolveSectionStyle } from "../utils/section-style.js";
import { resolveCurriculumTrackForUser } from "../utils/resolve-curriculum-track.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";

const getRouteParam = (value: string | string[] | undefined, name: string) => {
  if (!value || Array.isArray(value)) {
    throw new ApiError(400, `${name} is required`);
  }

  return value;
};

const getUserId = (request: Request) => {
  if (!request.user?.id) {
    throw new ApiError(401, "Authentication required");
  }

  return request.user.id;
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
      ...(() => {
        const { icon, color } = resolveSectionStyle({
          icon: typeof section.icon === "string" ? section.icon : undefined,
          color: typeof section.color === "string" ? section.color : undefined,
          variant:
            typeof section.variant === "string"
              ? (section.variant as CourseSectionInput["variant"])
              : undefined
        });

        return { icon, color };
      })()
    }));
};

const parseCourseDayBody = (body: Record<string, unknown>): Omit<UpsertCourseDayInput, "track"> => {
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
  const track = await resolveCurriculumTrackForUser(
    getUserId(request),
    request.user?.role,
    request
  );
  const publishedOnly = request.user?.role !== "admin";
  const courseDays = await getAllCourseDays(track, publishedOnly);

  response.status(200).json({
    success: true,
    message: "Course days fetched successfully",
    data: { courseDays, track }
  });
});

export const getCourseDayHandler = asyncHandler(async (request: Request, response: Response) => {
  const track = await resolveCurriculumTrackForUser(
    getUserId(request),
    request.user?.role,
    request
  );
  const dayNumber = Number(getRouteParam(request.params.dayNumber, "Day number"));
  const publishedOnly = request.user?.role !== "admin";
  const courseDay = await getCourseDayByNumber(track, dayNumber, publishedOnly);

  response.status(200).json({
    success: true,
    message: "Course day fetched successfully",
    data: { courseDay, track }
  });
});

export const upsertCourseDayHandler = asyncHandler(async (request: Request, response: Response) => {
  const track = await resolveCurriculumTrackForUser(
    getUserId(request),
    request.user?.role,
    request
  );
  const input = {
    track,
    ...parseCourseDayBody(request.body as Record<string, unknown>)
  };
  const courseDay = await upsertCourseDay(input);

  response.status(200).json({
    success: true,
    message: "Course day saved successfully",
    data: { courseDay, track }
  });
});

export const deleteCourseDayHandler = asyncHandler(async (request: Request, response: Response) => {
  const track = await resolveCurriculumTrackForUser(
    getUserId(request),
    request.user?.role,
    request
  );
  const dayNumber = Number(getRouteParam(request.params.dayNumber, "Day number"));
  await deleteCourseDay(track, dayNumber);

  response.status(200).json({
    success: true,
    message: "Course day deleted successfully",
    data: null
  });
});
