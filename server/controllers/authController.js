
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

// @desc    Register a new student
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password."
      });
    }

    // Reject non-string input before calling string methods on it
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password must be text."
      });
    }

    if (!name.trim() || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name and email cannot be empty."
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters."
      });
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Check whether the email is already registered
    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists."
      });
    }

    // Create student account
    // Password hashing happens in the User model's pre-save hook.
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password
    });

    // Generate JWT
    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        rollNumber: user.rollNumber || null,
        department: user.department || null,
        semester: user.semester ?? null
      }
    });

  } catch (error) {
    // Handle duplicate email errors
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists."
      });
    }

    // Schema validation failures are client errors, not server errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message:
          error.errors?.password?.message ||
          "Invalid registration details."
      });
    }

    console.error("Registration error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error during registration."
    });
  }
};


// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password."
      });
    }

    // Reject non-string input before calling string methods on it
    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({
        success: false,
        message: "Email and password must be text."
      });
    }

    // Find user and explicitly include the password field.
    // Password is excluded by default in the User model.
    const user = await User.findOne({
      email: email.trim().toLowerCase()
    }).select("+password");

    // Verify user and password
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    // Generate JWT
    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        rollNumber: user.rollNumber || null,
        department: user.department || null,
        semester: user.semester ?? null
      }
    });

  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error during login."
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      !currentPassword ||
      !newPassword
    ) {
      return res.status(400).json({
        success: false,
        message: "Current and new password are required."
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must contain at least 8 characters."
      });
    }

    // The password field is excluded by default on req.user
    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists."
      });
    }

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect."
      });
    }

    // Hashed by the User model's pre-save hook
    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully."
    });

  } catch (error) {
    console.error("Change password error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while changing password."
    });
  }
};

 // @desc    Get currently logged-in user
 // @route   GET /api/auth/me
 // @access  Private
export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      rollNumber: req.user.rollNumber || null,
      department: req.user.department || null,
      semester: req.user.semester ?? null
    }
  });
};
