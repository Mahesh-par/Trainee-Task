import { model, Schema, Types } from "mongoose";
import type { InferSchemaType } from "mongoose";

const attachmentSchema = new Schema(
  {
    originalName: {
      type: String,
      required: true,
      trim: true
    },
    storedName: {
      type: String,
      required: true,
      trim: true
    },
    mimeType: {
      type: String,
      required: true,
      trim: true
    },
    size: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { timestamps: true }
);

const daySubmissionSchema = new Schema(
  {
    trainee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    dayNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 15
    },
    content: {
      type: String,
      default: "",
      trim: true
    },
    attachments: {
      type: [attachmentSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

daySubmissionSchema.index({ trainee: 1, dayNumber: 1 }, { unique: true });

export type DaySubmission = InferSchemaType<typeof daySubmissionSchema> & {
  _id: Types.ObjectId;
};

export const DaySubmissionModel = model<DaySubmission>("DaySubmission", daySubmissionSchema);
