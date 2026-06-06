import { DEFAULT_CURRICULUM_TRACK } from "../constants/curriculum-tracks.js";
import { CourseDayModel } from "../models/course-day.model.js";
import { DaySubmissionModel } from "../models/day-submission.model.js";
import { DEFAULT_TOTAL_DAYS, ProgramSettingsModel } from "../models/program-settings.model.js";
import { UserModel } from "../models/user.model.js";

const dropStaleIndex = async (collectionName: string, indexName: string) => {
  try {
    const model =
      collectionName === "coursedays"
        ? CourseDayModel
        : collectionName === "daysubmissions"
          ? DaySubmissionModel
          : collectionName === "programsettings"
            ? ProgramSettingsModel
            : null;

    if (!model) {
      return;
    }

    await model.collection.dropIndex(indexName);
    console.log(`Dropped stale index ${indexName} on ${collectionName}`);
  } catch (error) {
    const mongoError = error as { code?: number; codeName?: string };

    if (mongoError.code === 27 || mongoError.codeName === "IndexNotFound") {
      return;
    }

    throw error;
  }
};

const migrateProgramSettings = async () => {
  const shopifySettings = await ProgramSettingsModel.findOne({
    track: DEFAULT_CURRICULUM_TRACK
  }).lean();

  const legacySettings = await ProgramSettingsModel.find({
    $or: [{ track: { $exists: false } }, { track: null }]
  }).lean();

  if (legacySettings.length === 0) {
    return;
  }

  if (shopifySettings) {
    await ProgramSettingsModel.deleteMany({
      $or: [{ track: { $exists: false } }, { track: null }]
    });
    return;
  }

  if (legacySettings.length === 1) {
    await ProgramSettingsModel.updateOne(
      { _id: legacySettings[0]._id },
      { $set: { track: DEFAULT_CURRICULUM_TRACK } }
    );
    return;
  }

  const keeper = legacySettings.reduce((best, current) =>
    (current.totalDays ?? DEFAULT_TOTAL_DAYS) > (best.totalDays ?? DEFAULT_TOTAL_DAYS) ? current : best
  );

  await ProgramSettingsModel.deleteMany({
    _id: { $ne: keeper._id },
    $or: [{ track: { $exists: false } }, { track: null }]
  });

  await ProgramSettingsModel.updateOne(
    { _id: keeper._id },
    { $set: { track: DEFAULT_CURRICULUM_TRACK } }
  );
};

const syncCurriculumIndexes = async () => {
  await Promise.all([
    CourseDayModel.syncIndexes(),
    DaySubmissionModel.syncIndexes(),
    ProgramSettingsModel.syncIndexes()
  ]);
};

export const migrateCurriculumTracks = async () => {
  await CourseDayModel.updateMany(
    { $or: [{ track: { $exists: false } }, { track: null }] },
    { $set: { track: DEFAULT_CURRICULUM_TRACK } }
  );

  await DaySubmissionModel.updateMany(
    { $or: [{ track: { $exists: false } }, { track: null }] },
    { $set: { track: DEFAULT_CURRICULUM_TRACK } }
  );

  await migrateProgramSettings();

  const legacyTraineeRoles = await UserModel.find({
    role: "user",
    trainingTrack: { $exists: true },
    $or: [{ traineeRole: { $exists: false } }, { traineeRole: null }]
  })
    .select("_id trainingTrack")
    .lean();

  for (const user of legacyTraineeRoles) {
    const legacyTrack = (user as { trainingTrack?: string }).trainingTrack;

    if (legacyTrack) {
      await UserModel.updateOne({ _id: user._id }, { $set: { traineeRole: legacyTrack } });
    }
  }

  await UserModel.updateMany(
    { role: "user", $or: [{ traineeRole: { $exists: false } }, { traineeRole: null }] },
    { $set: { traineeRole: DEFAULT_CURRICULUM_TRACK } }
  );

  try {
    await UserModel.collection.dropIndex("trainingTrack_1");
    console.log("Dropped stale index trainingTrack_1 on users");
  } catch (error) {
    const mongoError = error as { code?: number; codeName?: string };

    if (mongoError.code !== 27 && mongoError.codeName !== "IndexNotFound") {
      throw error;
    }
  }

  await dropStaleIndex("coursedays", "dayNumber_1");
  await dropStaleIndex("daysubmissions", "trainee_1_dayNumber_1");

  await syncCurriculumIndexes();

  console.log("Curriculum track migration completed");
};
