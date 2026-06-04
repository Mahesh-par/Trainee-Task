import { Router } from "express";

import {
  deleteMySubmissionAttachmentHandler,
  getMyDaySubmissionHandler,
  getSubmissionStatsHandler,
  listDaySubmissionsForAdminHandler,
  listTraineeSubmissionsForAdminHandler,
  upsertMyDaySubmissionHandler
} from "../controllers/day-submission.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { submissionUpload } from "../middleware/upload.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/stats", authorize("admin"), getSubmissionStatsHandler);
router.get("/day/:dayNumber", getMyDaySubmissionHandler);
router.get("/day/:dayNumber/all", authorize("admin"), listDaySubmissionsForAdminHandler);
router.get("/trainee/:traineeId", authorize("admin"), listTraineeSubmissionsForAdminHandler);
router.post(
  "/",
  authorize("user", "admin"),
  submissionUpload.array("files", 10),
  upsertMyDaySubmissionHandler
);
router.delete(
  "/day/:dayNumber/attachments/:attachmentId",
  authorize("user", "admin"),
  deleteMySubmissionAttachmentHandler
);

export default router;
