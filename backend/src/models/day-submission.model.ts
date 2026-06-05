import { model, Schema, Types } from "mongoose";
import type { InferSchemaType } from "mongoose";

export const submissionReviewStatuses = ["done", "need_improvement", "cancel"] as const;
export type SubmissionReviewStatus = (typeof submissionReviewStatuses)[number];

const submissionMessageSchema = new Schema(
  {
    role: {
      type: String,
      enum: ["admin", "trainee"],
      required: true
    },
    body: {
      type: String,
      required: true,
      trim: true
    },
    reviewStatus: {
      type: String,
      enum: submissionReviewStatuses,
      default: null
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

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
      min: 1
    },
    content: {
      type: String,
      default: "",
      trim: true
    },
    attachments: {
      type: [attachmentSchema],
      default: []
    },
    reviewStatus: {
      type: String,
      enum: submissionReviewStatuses,
      default: null
    },
    adminComment: {
      type: String,
      default: "",
      trim: true
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    traineeReply: {
      type: String,
      default: "",
      trim: true
    },
    traineeRepliedAt: {
      type: Date,
      default: null
    },
    adminReplyRead: {
      type: Boolean,
      default: true
    },
    messages: {
      type: [submissionMessageSchema],
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
