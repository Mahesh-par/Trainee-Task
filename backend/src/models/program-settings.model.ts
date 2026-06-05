import { model, Schema } from "mongoose";
import type { InferSchemaType } from "mongoose";

export const DEFAULT_TOTAL_DAYS = 15;
export const MIN_TOTAL_DAYS = 1;
export const MAX_TOTAL_DAYS = 365;

const programSettingsSchema = new Schema(
  {
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

export const ProgramSettingsModel = model<ProgramSettings>(
  "ProgramSettings",
  programSettingsSchema
);
