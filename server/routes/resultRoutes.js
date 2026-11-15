import express from "express";

import {
  createResult,
  getAllResults,
  getMyResults,
  getMySubjectResults,
  getResultById,
  updateResult,
  deleteResult
} from "../controllers/resultController.js";

import {
  protect,
  authorizeRoles
} from "../middleware/authMiddleware.js";

const router = express.Router();

// All result routes require authentication
router.use(protect);

// Student: view only their own results
router.get(
  "/my-results",
  authorizeRoles("student"),
  getMyResults
);

// Teacher: results for their own subjects (marks entry screen)
router.get(
  "/my-subjects",
  authorizeRoles("teacher"),
  getMySubjectResults
);

// Admin manages results; teachers may enter/correct marks for their
// own subjects (ownership is enforced inside the controllers)
router.post("/", authorizeRoles("admin", "teacher"), createResult);
router.get("/", authorizeRoles("admin"), getAllResults);
router.get("/:id", authorizeRoles("admin"), getResultById);
router.put("/:id", authorizeRoles("admin", "teacher"), updateResult);
router.delete("/:id", authorizeRoles("admin"), deleteResult);

export default router;
