import type { Request, Response } from "express";

import { taskStatuses } from "../models/task-assignment.model.js";
import {
  createTask,
  deleteTask,
  getAdminDashboard,
  getAllTasks,
  getTaskById,
  getTraineeProgress,
  getTraineeTasks,
  updateAssignmentStatus,
  updateTask
} from "../services/task.service.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";

const getUserIdFromRequest = (request: Request): string | undefined => {
  const requestWithUser = request as Request & { user?: { id?: string; _id?: string } };
  const headerUserId = request.header("x-user-id");

  return requestWithUser.user?.id ?? requestWithUser.user?._id ?? headerUserId;
};

const getRouteParam = (value: string | string[] | undefined, name: string) => {
  if (!value || Array.isArray(value)) {
    throw new ApiError(400, `${name} is required`);
  }

  return value;
};

export const createTaskHandler = asyncHandler(async (request: Request, response: Response) => {
  const { title, description, startDate, endDate, traineeIds } = request.body as {
    title?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    traineeIds?: string[];
  };

  if (!title?.trim()) {
    throw new ApiError(400, "Task title is required");
  }

  if (!description?.trim()) {
    throw new ApiError(400, "Task description is required");
  }

  if (!startDate || !endDate) {
    throw new ApiError(400, "Start date and end date are required");
  }

  if (!Array.isArray(traineeIds) || traineeIds.length === 0) {
    throw new ApiError(400, "At least one trainee is required");
  }

  const task = await createTask({
    title,
    description,
    startDate,
    endDate,
    traineeIds,
    createdBy: getUserIdFromRequest(request)
  });

  response.status(201).json({
    success: true,
    message: "Task created and assigned successfully",
    data: {
      task
    }
  });
});

export const getAllTasksHandler = asyncHandler(async (_request: Request, response: Response) => {
  const tasks = await getAllTasks();

  response.status(200).json({
    success: true,
    message: "Tasks fetched successfully",
    data: {
      tasks
    }
  });
});

export const getTaskHandler = asyncHandler(async (request: Request, response: Response) => {
  const taskId = getRouteParam(request.params.taskId, "Task id");
  const task = await getTaskById(taskId);

  response.status(200).json({
    success: true,
    message: "Task fetched successfully",
    data: {
      task
    }
  });
});

export const updateTaskHandler = asyncHandler(async (request: Request, response: Response) => {
  const taskId = getRouteParam(request.params.taskId, "Task id");
  const task = await updateTask(taskId, request.body);

  response.status(200).json({
    success: true,
    message: "Task updated successfully",
    data: {
      task
    }
  });
});

export const deleteTaskHandler = asyncHandler(async (request: Request, response: Response) => {
  const taskId = getRouteParam(request.params.taskId, "Task id");
  await deleteTask(taskId);

  response.status(200).json({
    success: true,
    message: "Task deleted successfully"
  });
});

export const getMyTasksHandler = asyncHandler(async (request: Request, response: Response) => {
  const traineeId = getUserIdFromRequest(request) ?? request.query.traineeId?.toString();

  if (!traineeId) {
    throw new ApiError(401, "Trainee id is required");
  }

  const tasks = await getTraineeTasks(traineeId);

  response.status(200).json({
    success: true,
    message: "Assigned tasks fetched successfully",
    data: {
      tasks
    }
  });
});

export const updateMyTaskStatusHandler = asyncHandler(
  async (request: Request, response: Response) => {
    const traineeId = getUserIdFromRequest(request) ?? request.body.traineeId;
    const { status } = request.body as { status?: string };

    if (!traineeId) {
      throw new ApiError(401, "Trainee id is required");
    }

    if (!status || !taskStatuses.includes(status as (typeof taskStatuses)[number])) {
      throw new ApiError(400, "Status must be pending, in_progress, or completed");
    }

    const assignmentId = getRouteParam(request.params.assignmentId, "Assignment id");
    const assignment = await updateAssignmentStatus(
      assignmentId,
      traineeId,
      status as (typeof taskStatuses)[number]
    );

    response.status(200).json({
      success: true,
      message: "Task status updated successfully",
      data: {
        assignment
      }
    });
  }
);

export const getMyProgressHandler = asyncHandler(async (request: Request, response: Response) => {
  const traineeId = getUserIdFromRequest(request) ?? request.query.traineeId?.toString();

  if (!traineeId) {
    throw new ApiError(401, "Trainee id is required");
  }

  const progress = await getTraineeProgress(traineeId);

  response.status(200).json({
    success: true,
    message: "Progress fetched successfully",
    data: {
      progress
    }
  });
});

export const getAdminDashboardHandler = asyncHandler(
  async (_request: Request, response: Response) => {
    const dashboard = await getAdminDashboard();

    response.status(200).json({
      success: true,
      message: "Dashboard fetched successfully",
      data: {
        dashboard
      }
    });
  }
);
