import { Router } from "express";
import * as settingsController from "../controllers/settings.controller.js";
import {
  authenticate,
  requirePermission,
} from "../middlewares/auth.middleware.js";
import { enforceSubscription } from "../middlewares/subscription.middleware.js";

const router = Router();

router.get("/settings/subscription/status", settingsController.getSubscription);
router.post(
  "/settings/subscription/extend",
  settingsController.extendSubscription,
);
router.use(authenticate);
router.use(enforceSubscription);

router.post(
  "/settings/subscription/change-password",
  requirePermission("settings_manage"),
  settingsController.changeSubscriptionControllerPassword,
);
router.post(
  "/settings/subscription/reset",
  requirePermission("settings_manage"),
  settingsController.resetSubscription,
);
router.get(
  "/settings",
  requirePermission("settings_manage"),
  settingsController.getSettings,
);
router.post(
  "/settings",
  requirePermission("settings_manage"),
  settingsController.updateSettings,
);
router.get(
  "/settings/:key",
  requirePermission("settings_manage"),
  settingsController.getSetting,
);
router.post(
  "/settings/:key",
  requirePermission("settings_manage"),
  settingsController.setSetting,
);

export default router;
