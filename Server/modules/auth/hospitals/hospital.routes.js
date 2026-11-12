
import { Router } from "express";
import {
  getMyHospitals,
  switchHospital,
} from "./hospital.controller.js";
import { requireAuth } from "../../middleware/requireAuth.js";

const router = Router();

router.get("/mine", requireAuth, getMyHospitals);
router.post("/switch", requireAuth, switchHospital);

export default router;
