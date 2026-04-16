import { Router } from "express";
import * as settingsController from "../controllers/settings.controller.js";

const router = Router();

router.get("/settings", settingsController.getSettings);
router.post("/settings", settingsController.updateSettings);
router.get("/settings/:key", settingsController.getSetting);
router.post("/settings/:key", settingsController.setSetting);

export default router;