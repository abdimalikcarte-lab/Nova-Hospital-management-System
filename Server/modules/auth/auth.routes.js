
import { Router } from "express";
import {
  login,
  getMe,
  logout,
} from "./auth.controller.js";
import { requireAuth } from "../../middleware/requireAuth.js";

const router = Router();

router.post("/login", login);
router.get("/me", requireAuth, getMe);
router.post("/logout", requireAuth, logout);

export default router;

