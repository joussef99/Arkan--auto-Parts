import { Router } from "express";
import * as settingsController from "../controllers/settings.controller.js";

const router = Router();

router.get("/settings/subscription/status", settingsController.getSubscription);
router.post("/settings/subscription/extend", settingsController.extendSubscription);
router.post("/settings/subscription/change-password", settingsController.changeSubscriptionControllerPassword);
router.post("/settings/subscription/reset", settingsController.resetSubscription);
router.get("/settings", settingsController.getSettings);
router.post("/settings", settingsController.updateSettings);
router.get("/settings/:key", settingsController.getSetting);
router.post("/settings/:key", settingsController.setSetting);

export default router;