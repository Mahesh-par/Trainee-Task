import { Router } from "express";

import { getTraineesHandler, updateTraineeRoleHandler } from "../controllers/user.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/trainees", authenticate, authorize("admin"), getTraineesHandler);
router.patch(
  "/trainees/:traineeId/role",
  authenticate,
  authorize("admin"),
  updateTraineeRoleHandler
);

export default router;
