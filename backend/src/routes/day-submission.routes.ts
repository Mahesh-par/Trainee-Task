import { Router } from "express";

import {
  deleteMySubmissionAttachmentHandler,
  getMyDayProgressHandler,
  getMyDaySubmissionHandler,
  getSubmissionStatsHandler,
  listDaySubmissionsForAdminHandler,
  getUnreadReplyCountsHandler,
  listTraineeSubmissionsForAdminHandler,
  markTraineeRepliesReadHandler,
  submitTraineeReplyHandler,
  updateSubmissionReviewHandler,
  upsertMyDaySubmissionHandler
} from "../controllers/day-submission.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { submissionUpload } from "../middleware/upload.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/stats", authorize("admin"), getSubmissionStatsHandler);
router.get("/unread-replies", authorize("admin"), getUnreadReplyCountsHandler);
router.patch("/:submissionId/review", authorize("admin"), updateSubmissionReviewHandler);
router.patch(
  "/trainee/:traineeId/mark-replies-read",
  authorize("admin"),
  markTraineeRepliesReadHandler
);
router.patch("/day/:dayNumber/reply", authorize("user", "admin"), submitTraineeReplyHandler);
router.get("/my-progress", authorize("user", "admin"), getMyDayProgressHandler);
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
