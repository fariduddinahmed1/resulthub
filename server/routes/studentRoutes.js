
import express from "express";

import {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent
} from "../controllers/studentController.js";

import {
  protect,
  authorizeRoles
} from "../middleware/authMiddleware.js";

const router = express.Router();

// All student routes require authentication
router.use(protect);

// Admin: create students and teachers
router.post("/", authorizeRoles("admin"), createStudent);

// Admin and teacher: list users (teachers need the roster for marks entry)
router.get("/", authorizeRoles("admin", "teacher"), getAllStudents);

// Admin: manage individual records
router.get("/:id", authorizeRoles("admin"), getStudentById);
router.put("/:id", authorizeRoles("admin"), updateStudent);
router.delete("/:id", authorizeRoles("admin"), deleteStudent);

export default router;
