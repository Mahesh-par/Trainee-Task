import { Router } from "express";

import {
  createTaskHandler,
  deleteTaskHandler,
  getAdminDashboardHandler,
  getAllTasksHandler,
  getMyProgressHandler,
  getMyTasksHandler,
  getTaskHandler,
  updateMyTaskStatusHandler,
  updateTaskHandler
} from "../controllers/task.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.post("/", authorize("admin"), createTaskHandler);
router.get("/", authorize("admin"), getAllTasksHandler);
router.get("/dashboard", authorize("admin"), getAdminDashboardHandler);
router.get("/my-tasks", authorize("user", "admin"), getMyTasksHandler);
router.get("/my-progress", authorize("user", "admin"), getMyProgressHandler);
router.patch(
  "/assignments/:assignmentId/status",
  authorize("user", "admin"),
  updateMyTaskStatusHandler
);
router.get("/:taskId", authorize("admin"), getTaskHandler);
router.patch("/:taskId", authorize("admin"), updateTaskHandler);
router.delete("/:taskId", authorize("admin"), deleteTaskHandler);

export default router;
