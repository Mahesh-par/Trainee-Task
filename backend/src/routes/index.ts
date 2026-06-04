import { Router } from "express";

import authRoutes from "./auth.routes.js";
import courseDayRoutes from "./course-day.routes.js";
import daySubmissionRoutes from "./day-submission.routes.js";
import healthRoutes from "./health.routes.js";
import taskRoutes from "./task.routes.js";
import userRoutes from "./user.routes.js";

const router = Router();

router.use("/api/auth", authRoutes);
router.use("/api/course-days", courseDayRoutes);
router.use("/api/submissions", daySubmissionRoutes);
router.use("/api/tasks", taskRoutes);
router.use("/api/users", userRoutes);
router.use(healthRoutes);

export default router;
