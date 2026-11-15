
import express from "express";

import {
  registerUser,
  loginUser,
  changePassword,
  getMe
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected routes (any role)
router.get("/me", protect, getMe);
router.put("/change-password", protect, changePassword);

export default router;
