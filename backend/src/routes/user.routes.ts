import { Router } from "express";

import { getTraineesHandler } from "../controllers/user.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/trainees", authenticate, authorize("admin"), getTraineesHandler);

export default router;
