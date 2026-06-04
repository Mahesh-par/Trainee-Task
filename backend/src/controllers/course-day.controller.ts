import type { Request, Response } from "express";

import {
  deleteCourseDay,
  getAllCourseDays,
  getCourseDayByNumber,
  upsertCourseDay
} from "../services/course-day.service.js";
import type { ResourceLinkInput, UpsertCourseDayInput } from "../services/course-day.service.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";

const getRouteParam = (value: string | string[] | undefined, name: string) => {
  if (!value || Array.isArray(value)) {
    throw new ApiError(400, `${name} is required`);
  }

  return value;
};

const parseResources = (resources: unknown): ResourceLinkInput[] => {
  if (!Array.isArray(resources)) {
    return [];
  }

  return resources
    .filter((resource): resource is ResourceLinkInput => {
      return (
        typeof resource === "object" &&
        resource !== null &&
        "label" in resource &&
        "url" in resource &&
        typeof resource.label === "string" &&
        typeof resource.url === "string"
      );
    })
    .map((resource) => ({
      label: resource.label,
      url: resource.url
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
    explanation: String(body.explanation ?? ""),
    resources: parseResources(body.resources),
    shopifyApplication: String(body.shopifyApplication ?? ""),
    shopifyAccessPath: String(body.shopifyAccessPath ?? ""),
    dailyTask: String(body.dailyTask ?? ""),
    developerTips: String(body.developerTips ?? ""),
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
