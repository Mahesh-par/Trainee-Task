import { model, Schema } from "mongoose";
import type { InferSchemaType } from "mongoose";

const resourceLinkSchema = new Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    }
  },
  { _id: false }
);

const courseDaySchema = new Schema(
  {
    dayNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 15,
      unique: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2
    },
    explanation: {
      type: String,
      required: true,
      trim: true
    },
    resources: {
      type: [resourceLinkSchema],
      default: []
    },
    shopifyApplication: {
      type: String,
      required: true,
      trim: true
    },
    shopifyAccessPath: {
      type: String,
      required: true,
      trim: true
    },
    dailyTask: {
      type: String,
      required: true,
      trim: true
    },
    developerTips: {
      type: String,
      required: true,
      trim: true
    },
    isPublished: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

courseDaySchema.index({ dayNumber: 1 });

export type CourseDay = InferSchemaType<typeof courseDaySchema>;

export const CourseDayModel = model<CourseDay>("CourseDay", courseDaySchema);
