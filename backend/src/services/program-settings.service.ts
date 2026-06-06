import type { CurriculumTrack } from "../constants/curriculum-tracks.js";
import { CourseDayModel } from "../models/course-day.model.js";
import { DaySubmissionModel } from "../models/day-submission.model.js";
import {
  DEFAULT_TOTAL_DAYS,
  MAX_TOTAL_DAYS,
  MIN_TOTAL_DAYS,
  ProgramSettingsModel
} from "../models/program-settings.model.js";
import { ApiError } from "../utils/api-error.js";

export const getTotalDays = async (track: CurriculumTrack) => {
  const settings = await ProgramSettingsModel.findOne({ track }).lean();

  if (!settings) {
    await ProgramSettingsModel.create({ track, totalDays: DEFAULT_TOTAL_DAYS });
    return DEFAULT_TOTAL_DAYS;
  }

  return settings.totalDays;
};

export const getMinimumTotalDays = async (track: CurriculumTrack) => {
  const [highestCourseDay, highestSubmissionDay] = await Promise.all([
    CourseDayModel.findOne({ track }).sort({ dayNumber: -1 }).select("dayNumber").lean(),
    DaySubmissionModel.findOne({ track }).sort({ dayNumber: -1 }).select("dayNumber").lean()
  ]);

  return Math.max(
    MIN_TOTAL_DAYS,
    highestCourseDay?.dayNumber ?? 0,
    highestSubmissionDay?.dayNumber ?? 0
  );
};

export const getProgramSettings = async (track: CurriculumTrack) => {
  const [totalDays, minimumTotalDays] = await Promise.all([
    getTotalDays(track),
    getMinimumTotalDays(track)
  ]);

  return {
    track,
    totalDays,
    minimumTotalDays
  };
};

export const updateTotalDays = async (track: CurriculumTrack, totalDays: number) => {
  if (!Number.isInteger(totalDays) || totalDays < MIN_TOTAL_DAYS || totalDays > MAX_TOTAL_DAYS) {
    throw new ApiError(400, `Total days must be between ${MIN_TOTAL_DAYS} and ${MAX_TOTAL_DAYS}`);
  }

  const currentTotalDays = await getTotalDays(track);

  if (totalDays < currentTotalDays) {
    const minimumAllowed = await getMinimumTotalDays(track);

    if (totalDays < minimumAllowed) {
      throw new ApiError(
        400,
        `Cannot set total days below ${minimumAllowed} because saved curriculum or trainee submissions exist for that day`
      );
    }
  }

  const settings = await ProgramSettingsModel.findOneAndUpdate(
    { track },
    { track, totalDays },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return {
    track,
    totalDays: settings?.totalDays ?? totalDays,
    minimumTotalDays: await getMinimumTotalDays(track)
  };
};

export const validateDayInProgram = async (track: CurriculumTrack, dayNumber: number) => {
  const totalDays = await getTotalDays(track);

  if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > totalDays) {
    throw new ApiError(400, `Day number must be between 1 and ${totalDays}`);
  }
};
