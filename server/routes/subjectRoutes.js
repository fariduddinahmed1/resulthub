
import express from "express";

import {
  createSubject,
  getAllSubjects,
  getMySubjects,
  getSubjectById,
  updateSubject,
  deleteSubject
} from "../controllers/subjectController.js";

import {
  protect,
  authorizeRoles
} from "../middleware/authMiddleware.js";

const router = express.Router();

// All subject routes require authentication
router.use(protect);

// Teacher: subjects assigned to them
router.get("/my", authorizeRoles("teacher"), getMySubjects);

// Admin: manage all subjects
router.post("/", authorizeRoles("admin"), createSubject);
router.get("/", authorizeRoles("admin"), getAllSubjects);
router.get("/:id", authorizeRoles("admin"), getSubjectById);
router.put("/:id", authorizeRoles("admin"), updateSubject);
router.delete("/:id", authorizeRoles("admin"), deleteSubject);

export default router;
