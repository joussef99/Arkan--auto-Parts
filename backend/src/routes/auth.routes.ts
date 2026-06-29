import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import {
  authenticate,
  requirePermission,
} from "../middlewares/auth.middleware.js";
import { createRateLimiter } from "../middlewares/request-rate.middleware.js";
import { enforceSubscription } from "../middlewares/subscription.middleware.js";

const router = Router();

const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 20,
});

router.post("/login", loginRateLimiter, authController.login);
router.get(
  "/users",
  authenticate,
  enforceSubscription,
  requirePermission("users_manage"),
  authController.getUsers,
);
router.post(
  "/users",
  authenticate,
  enforceSubscription,
  requirePermission("users_manage"),
  authController.createUser,
);
router.put(
  "/users/:id",
  authenticate,
  enforceSubscription,
  requirePermission("users_manage"),
  authController.updateUser,
);
router.delete(
  "/users/:id",
  authenticate,
  enforceSubscription,
  requirePermission("users_manage"),
  authController.deleteUser,
);

export default router;
