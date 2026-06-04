import { model, Schema, Types } from "mongoose";
import type { InferSchemaType } from "mongoose";

export const taskStatuses = ["pending", "in_progress", "completed"] as const;
export type TaskStatus = (typeof taskStatuses)[number];

const taskAssignmentSchema = new Schema(
  {
    task: {                                                                                 
      type: Schema.Types.ObjectId,                                                                                 
      ref: "Task",                                                                                 
      required: true                                                                                 
    },                                                                                 
    trainee: {                                                                                 
      type: Schema.Types.ObjectId,                                                                                 
      ref: "User",                                                                                 
      required: true                                                                                 
    },                                                                                 
    status: {                                                                                 
      type: String,                                                                                 
      enum: taskStatuses,                                                                                 
      default: "pending"                                                                                 
    },                                                                                 
    completedAt: {                                                                                 
      type: Date,                                                                                 
      default: null                                                                                 
    }                                                                                 
  },                                                                                 
  {                                                                                 
    timestamps: true                                                                                 
  }                                                                                 
);                                                                             

taskAssignmentSchema.index({ task: 1, trainee: 1 }, { unique: true });
taskAssignmentSchema.index({ trainee: 1, status: 1 });

export type TaskAssignment = InferSchemaType<typeof taskAssignmentSchema> & {
  _id: Types.ObjectId;
};

export const TaskAssignmentModel = model<TaskAssignment>(
  "TaskAssignment",
  taskAssignmentSchema
);
