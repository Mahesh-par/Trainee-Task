import { model, Schema } from "mongoose";
import type { InferSchemaType } from "mongoose";

import { curriculumTracks } from "../constants/curriculum-tracks.js";

export const DEFAULT_TOTAL_DAYS = 15;
export const MIN_TOTAL_DAYS = 1;
export const MAX_TOTAL_DAYS = 365;

const programSettingsSchema = new Schema(
  {
    track: {
      type: String,
      enum: curriculumTracks,
      required: true,
      default: "shopify"
    },
    totalDays: {
      type: Number,
      required: true,
      min: MIN_TOTAL_DAYS,
      max: MAX_TOTAL_DAYS,
      default: DEFAULT_TOTAL_DAYS
    }
  },
  {
    timestamps: true
  }
);

export type ProgramSettings = InferSchemaType<typeof programSettingsSchema>;

programSettingsSchema.index({ track: 1 }, { unique: true });

export const ProgramSettingsModel = model<ProgramSettings>(
  "ProgramSettings",
  programSettingsSchema
);
