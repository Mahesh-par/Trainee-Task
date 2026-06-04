import { model, Schema, Types } from "mongoose";
import type { InferSchemaType } from "mongoose";

const taskSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    assignedTrainees: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
      }
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  {
    timestamps: true
  }
);

taskSchema.index({ createdAt: -1 });

export type Task = InferSchemaType<typeof taskSchema> & {
  _id: Types.ObjectId;
};

export const TaskModel = model<Task>("Task", taskSchema);
