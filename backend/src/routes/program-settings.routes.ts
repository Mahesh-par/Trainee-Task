import { Router } from "express";

import {
  getProgramSettingsHandler,
  updateProgramSettingsHandler
} from "../controllers/program-settings.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", getProgramSettingsHandler);
router.patch("/", authorize("admin"), updateProgramSettingsHandler);

export default router;
