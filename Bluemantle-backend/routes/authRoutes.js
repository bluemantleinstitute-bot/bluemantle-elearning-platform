const express = require("express");
const router = express.Router();
const { login, verifyOtp, getMe, logout } = require("../controllers/authController");
const { validateLogin } = require("../validations/authValidation");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/login", validateLogin, login);
router.post("/verify-otp", verifyOtp);
router.post("/logout", logout);
router.get("/me", authMiddleware, getMe);

module.exports = router;
