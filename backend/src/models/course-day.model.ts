import { model, Schema } from "mongoose";
import type { InferSchemaType } from "mongoose";

import { curriculumTracks } from "../constants/curriculum-tracks.js";
import { courseSectionColors, courseSectionIcons } from "../utils/section-style.js";

export const courseSectionTypes = ["text", "resources"] as const;
export type CourseSectionType = (typeof courseSectionTypes)[number];

export const courseSectionVariants = ["default", "task", "tips", "shopify", "location"] as const;
export type CourseSectionVariant = (typeof courseSectionVariants)[number];

export type { CourseSectionColor, CourseSectionIcon } from "../utils/section-style.js";
export { courseSectionColors, courseSectionIcons } from "../utils/section-style.js";

const resourceLinkSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const courseSectionSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    type: { type: String, enum: courseSectionTypes, required: true },
    order: { type: Number, required: true, min: 0 },
    content: { type: String, default: "", trim: true },
    resources: { type: [resourceLinkSchema], default: [] },
    icon: {
      type: String,
      enum: courseSectionIcons,
      default: "none"
    },
    color: {
      type: String,
      enum: courseSectionColors,
      default: "default"
    },
    variant: {
      type: String,
      enum: courseSectionVariants,
      default: "default"
    }
  },
  { _id: false }
);

const courseDaySchema = new Schema(
  {
    track: {
      type: String,
      enum: curriculumTracks,
      required: true,
      default: "shopify"
    },
    dayNumber: {
      type: Number,
      required: true,
      min: 1
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2
    },
    sections: {
      type: [courseSectionSchema],
      default: []
    },
    explanation: { type: String, default: "", trim: true },
    resources: { type: [resourceLinkSchema], default: [] },
    shopifyApplication: { type: String, default: "", trim: true },
    shopifyAccessPath: { type: String, default: "", trim: true },
    dailyTask: { type: String, default: "", trim: true },
    developerTips: { type: String, default: "", trim: true },
    isPublished: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

courseDaySchema.index({ track: 1, dayNumber: 1 }, { unique: true });

export type CourseDay = InferSchemaType<typeof courseDaySchema>;

export const CourseDayModel = model<CourseDay>("CourseDay", courseDaySchema);
