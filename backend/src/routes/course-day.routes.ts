import { Router } from "express";

import {
  deleteCourseDayHandler,
  getCourseDayHandler,
  listCourseDaysHandler,
  upsertCourseDayHandler
} from "../controllers/course-day.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", listCourseDaysHandler);
router.get("/:dayNumber", getCourseDayHandler);
router.put("/", authorize("admin"), upsertCourseDayHandler);
router.delete("/:dayNumber", authorize("admin"), deleteCourseDayHandler);

export default router;
