import { Types } from "mongoose";

import { TaskAssignmentModel } from "../models/task-assignment.model.js";
import type { TaskStatus } from "../models/task-assignment.model.js";
import { TaskModel } from "../models/task.model.js";
import { UserModel } from "../models/user.model.js";
import { ApiError } from "../utils/api-error.js";

const maxTaskDurationInDays = 15;
const millisecondsPerDay = 24 * 60 * 60 * 1000;

type CreateTaskInput = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  traineeIds: string[];
  createdBy?: string;
};

type UpdateTaskInput = Partial<Omit<CreateTaskInput, "createdBy">>;

const parseTaskDates = (startDateInput: string, endDateInput: string) => {
  const startDate = new Date(startDateInput);
  const endDate = new Date(endDateInput);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new ApiError(400, "Start date and end date must be valid dates");
  }

  if (endDate < startDate) {
    throw new ApiError(400, "End date must be after start date");
  }

  const durationInDays = (endDate.getTime() - startDate.getTime()) / millisecondsPerDay;

  if (durationInDays > maxTaskDurationInDays) {
    throw new ApiError(400, "Task duration cannot be more than 15 days");
  }

  return { startDate, endDate };
};

const getUniqueObjectIds = (ids: string[], fieldName: string) => {
  const uniqueIds = [...new Set(ids)];

  if (uniqueIds.length === 0) {
    throw new ApiError(400, `${fieldName} is required`);
  }

  for (const id of uniqueIds) {
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(400, `Invalid ${fieldName} id: ${id}`);
    }
  }

  return uniqueIds.map((id) => new Types.ObjectId(id));
};

const validateTrainees = async (traineeIds: Types.ObjectId[]) => {
  const trainees = await UserModel.find({
    _id: { $in: traineeIds },
    role: "user"
  }).select("_id name email role");

  if (trainees.length !== traineeIds.length) {
    throw new ApiError(400, "One or more trainees are invalid");
  }
};

export const createTask = async ({
  title,
  description,
  startDate,
  endDate,
  traineeIds,
  createdBy
}: CreateTaskInput) => {
  const parsedDates = parseTaskDates(startDate, endDate);
  const traineeObjectIds = getUniqueObjectIds(traineeIds, "trainee");

  await validateTrainees(traineeObjectIds);

  const task = await TaskModel.create({
    title: title.trim(),
    description: description.trim(),
    startDate: parsedDates.startDate,
    endDate: parsedDates.endDate,
    assignedTrainees: traineeObjectIds,
    createdBy: createdBy && Types.ObjectId.isValid(createdBy) ? createdBy : null
  });

  await TaskAssignmentModel.insertMany(
    traineeObjectIds.map((traineeId) => ({
      task: task._id,
      trainee: traineeId,
      status: "pending"
    }))
  );

  return getTaskById(task._id.toString());
};

export const getAllTasks = async () => {
  const tasks = await TaskModel.find().sort({ createdAt: -1 }).lean();

  return Promise.all(tasks.map((task) => getTaskById(task._id.toString())));
};

export const getTaskById = async (taskId: string) => {
  if (!Types.ObjectId.isValid(taskId)) {
    throw new ApiError(400, "Invalid task id");
  }

  const task = await TaskModel.findById(taskId)
    .populate("assignedTrainees", "name email role")
    .lean();

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  const assignments = await TaskAssignmentModel.find({ task: task._id })
    .populate("trainee", "name email role")
    .sort({ createdAt: 1 })
    .lean();

  return {
    ...task,
    assignments
  };
};

export const updateTask = async (taskId: string, input: UpdateTaskInput) => {
  if (!Types.ObjectId.isValid(taskId)) {
    throw new ApiError(400, "Invalid task id");
  }

  const task = await TaskModel.findById(taskId);

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  if (input.title !== undefined) {
    task.title = input.title.trim();
  }

  if (input.description !== undefined) {
    task.description = input.description.trim();
  }

  if (input.startDate !== undefined || input.endDate !== undefined) {
    const parsedDates = parseTaskDates(
      input.startDate ?? task.startDate.toISOString(),
      input.endDate ?? task.endDate.toISOString()
    );

    task.startDate = parsedDates.startDate;
    task.endDate = parsedDates.endDate;
  }

  if (input.traineeIds !== undefined) {
    const traineeObjectIds = getUniqueObjectIds(input.traineeIds, "trainee");
    await validateTrainees(traineeObjectIds);

    const existingAssignments = await TaskAssignmentModel.find({ task: task._id });
    const existingTraineeIds = new Set(
      existingAssignments.map((assignment) => assignment.trainee.toString())
    );

    await TaskAssignmentModel.deleteMany({
      task: task._id,
      trainee: { $nin: traineeObjectIds }
    });

    const newAssignments = traineeObjectIds
      .filter((traineeId) => !existingTraineeIds.has(traineeId.toString()))
      .map((traineeId) => ({
        task: task._id,
        trainee: traineeId,
        status: "pending"
      }));

    if (newAssignments.length > 0) {
      await TaskAssignmentModel.insertMany(newAssignments);
    }

    task.assignedTrainees = traineeObjectIds;
  }

  await task.save();

  return getTaskById(task._id.toString());
};

export const deleteTask = async (taskId: string) => {
  if (!Types.ObjectId.isValid(taskId)) {
    throw new ApiError(400, "Invalid task id");
  }

  const task = await TaskModel.findByIdAndDelete(taskId);

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  await TaskAssignmentModel.deleteMany({ task: task._id });
};

export const getTraineeTasks = async (traineeId: string) => {
  if (!Types.ObjectId.isValid(traineeId)) {
    throw new ApiError(400, "Invalid trainee id");
  }

  return TaskAssignmentModel.find({ trainee: traineeId })
    .populate("task", "title description startDate endDate")
    .sort({ createdAt: -1 })
    .lean();
};

export const updateAssignmentStatus = async (
  assignmentId: string,
  traineeId: string,
  status: TaskStatus
) => {
  if (!Types.ObjectId.isValid(assignmentId)) {
    throw new ApiError(400, "Invalid assignment id");
  }

  if (!Types.ObjectId.isValid(traineeId)) {
    throw new ApiError(400, "Invalid trainee id");
  }

  const assignment = await TaskAssignmentModel.findOne({
    _id: assignmentId,
    trainee: traineeId
  });

  if (!assignment) {
    throw new ApiError(404, "Task assignment not found");
  }

  assignment.status = status;
  assignment.completedAt = status === "completed" ? new Date() : null;
  await assignment.save();

  return TaskAssignmentModel.findById(assignment._id)
    .populate("task", "title description startDate endDate")
    .populate("trainee", "name email role")
    .lean();
};

export const getTraineeProgress = async (traineeId: string) => {
  if (!Types.ObjectId.isValid(traineeId)) {
    throw new ApiError(400, "Invalid trainee id");
  }

  const [totalTasks, completedTasks, inProgressTasks, pendingTasks] = await Promise.all([
    TaskAssignmentModel.countDocuments({ trainee: traineeId }),
    TaskAssignmentModel.countDocuments({ trainee: traineeId, status: "completed" }),
    TaskAssignmentModel.countDocuments({ trainee: traineeId, status: "in_progress" }),
    TaskAssignmentModel.countDocuments({ trainee: traineeId, status: "pending" })
  ]);

  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    pendingTasks,
    completionPercentage:
      totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100)
  };
};

export const getAdminDashboard = async () => {
  const trainees = await UserModel.find({ role: "user" })
    .select("_id name email role")
    .sort({ createdAt: -1 })
    .lean();

  return Promise.all(
    trainees.map(async (trainee) => ({
      trainee,
      progress: await getTraineeProgress(trainee._id.toString())
    }))
  );
};
