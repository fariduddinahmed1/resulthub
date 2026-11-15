import express from "express";

import {
  createExam,
  getAllExams,
  getMyExams,
  getExamById,
  updateExam,
  deleteExam
} from "../controllers/examController.js";

import {
  protect,
  authorizeRoles
} from "../middleware/authMiddleware.js";

const router = express.Router();

// All exam routes require authentication
router.use(protect);

// Teacher: exams for subjects assigned to them
router.get("/my", authorizeRoles("teacher"), getMyExams);

// Admin: manage exams
router.post("/", authorizeRoles("admin"), createExam);
router.get("/", authorizeRoles("admin"), getAllExams);
router.get("/:id", authorizeRoles("admin"), getExamById);
router.put("/:id", authorizeRoles("admin"), updateExam);
router.delete("/:id", authorizeRoles("admin"), deleteExam);

export default router;
