import { CourseDayModel } from "../models/course-day.model.js";
import { DaySubmissionModel } from "../models/day-submission.model.js";
import {
  DEFAULT_TOTAL_DAYS,
  MAX_TOTAL_DAYS,
  MIN_TOTAL_DAYS,
  ProgramSettingsModel
} from "../models/program-settings.model.js";
import { ApiError } from "../utils/api-error.js";

export const getTotalDays = async () => {
  const settings = await ProgramSettingsModel.findOne().lean();

  if (!settings) {
    await ProgramSettingsModel.create({ totalDays: DEFAULT_TOTAL_DAYS });
    return DEFAULT_TOTAL_DAYS;
  }

  return settings.totalDays;
};

export const getMinimumTotalDays = async () => {
  const [highestCourseDay, highestSubmissionDay] = await Promise.all([
    CourseDayModel.findOne().sort({ dayNumber: -1 }).select("dayNumber").lean(),
    DaySubmissionModel.findOne().sort({ dayNumber: -1 }).select("dayNumber").lean()
  ]);

  return Math.max(
    MIN_TOTAL_DAYS,
    highestCourseDay?.dayNumber ?? 0,
    highestSubmissionDay?.dayNumber ?? 0
  );
};

export const getProgramSettings = async () => {
  const [totalDays, minimumTotalDays] = await Promise.all([getTotalDays(), getMinimumTotalDays()]);

  return {
    totalDays,
    minimumTotalDays
  };
};

export const updateTotalDays = async (totalDays: number) => {
  if (!Number.isInteger(totalDays) || totalDays < MIN_TOTAL_DAYS || totalDays > MAX_TOTAL_DAYS) {
    throw new ApiError(400, `Total days must be between ${MIN_TOTAL_DAYS} and ${MAX_TOTAL_DAYS}`);
  }

  const currentTotalDays = await getTotalDays();

  if (totalDays < currentTotalDays) {
    const minimumAllowed = await getMinimumTotalDays();

    if (totalDays < minimumAllowed) {
      throw new ApiError(
        400,
        `Cannot set total days below ${minimumAllowed} because saved curriculum or trainee submissions exist for that day`
      );
    }
  }

  const settings = await ProgramSettingsModel.findOneAndUpdate(
    {},
    { totalDays },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return {
    totalDays: settings?.totalDays ?? totalDays,
    minimumTotalDays: await getMinimumTotalDays()
  };
};

export const validateDayInProgram = async (dayNumber: number) => {
  const totalDays = await getTotalDays();

  if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > totalDays) {
    throw new ApiError(400, `Day number must be between 1 and ${totalDays}`);
  }
};
