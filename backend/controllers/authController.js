const User = require("../models/User");
const Pdf = require("../models/Pdf");
const Chat = require("../models/Chat");
const Quiz = require("../models/Quiz");
const Flashcard = require("../models/Flashcard");
const Activity = require("../models/Activity");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { sendEmail } = require("../services/emailService");

// Generate JWT Token
const generateToken = (id, rememberMe) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: rememberMe ? "30d" : "7d",
  });
};

// Register User
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please enter all fields" });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      verificationToken,
    });

    // Send verification email
    const verifyUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/auth/verify/${verificationToken}`;
    
    // Also support a frontend route if they want to click it there, e.g. /verify-email/:token
    const clientVerifyUrl = `http://localhost:5173/verify-email/${verificationToken}`;

    const emailResponse = await sendEmail({
      to: user.email,
      subject: "Verify your email - AI Study Assistant",
      text: `Hello ${name},\n\nPlease verify your email by clicking on the link below:\n\n${clientVerifyUrl}\n\nThank you!`,
      html: `<h3>Hello ${name},</h3><p>Please verify your email by clicking the link below:</p><a href="${clientVerifyUrl}" style="padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a><br/><br/><p>If you cannot click the button, copy and paste this link: ${clientVerifyUrl}</p>`,
    });

    res.status(201).json({
      message: "User Registered Successfully. Verification email sent.",
      userId: user._id,
      mockVerificationLink: emailResponse.mock ? clientVerifyUrl : undefined,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify Email Token
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification token" });
    }

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    // Log verification activity
    await Activity.create({
      userId: user._id,
      type: "upload", // generic activity type
      description: "Verified email address successfully",
    });

    res.status(200).json({ message: "Email verified successfully! You can now log in." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login User
const loginUser = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const token = generateToken(user._id, rememberMe);

    res.status(200).json({
      message: "Login Successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        theme: user.theme,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Forgot Password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "No user found with that email" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    
    // Hash token and set expiry
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

    const emailResponse = await sendEmail({
      to: user.email,
      subject: "Password Reset Request - AI Study Assistant",
      text: `Hello ${user.name},\n\nYou requested a password reset. Please click on the link below to reset your password:\n\n${resetUrl}\n\nThis link is valid for 1 hour.`,
      html: `<h3>Hello ${user.name},</h3><p>You requested a password reset. Click the button below to reset your password:</p><a href="${resetUrl}" style="padding: 10px 20px; background-color: #ef4444; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a><br/><br/><p>If you cannot click the button, copy and paste this link: ${resetUrl}</p>`,
    });

    res.status(200).json({
      message: "Reset link sent to your email",
      mockResetLink: emailResponse.mock ? resetUrl : undefined,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Hash new password and save
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({ message: "Password updated successfully! You can now log in." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Current User (Me)
const getMe = async (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Profile
const updateProfile = async (req, res) => {
  try {
    const { name, theme } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name;
    if (theme) user.theme = theme;

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        theme: user.theme,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Change Password
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Please provide old and new password" });
    }

    const user = await User.findById(req.user.id);

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect old password" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Account
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    // Delete user's PDFs and their associated files from uploads/
    const pdfs = await Pdf.find({ userId });
    for (const pdf of pdfs) {
      if (fs.existsSync(pdf.filePath)) {
        try {
          fs.unlinkSync(pdf.filePath);
        } catch (fileErr) {
          console.error(`Failed to delete file ${pdf.filePath}:`, fileErr);
        }
      }
    }
    await Pdf.deleteMany({ userId });

    // Delete Chats, Quizzes, Flashcards, Activities associated with user
    await Chat.deleteMany({ userId });
    await Quiz.deleteMany({ userId });
    await Flashcard.deleteMany({ userId });
    await Activity.deleteMany({ userId });

    // Finally, delete User
    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: "Account and all associated study data deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  verifyEmail,
  loginUser,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  changePassword,
  deleteAccount,
};