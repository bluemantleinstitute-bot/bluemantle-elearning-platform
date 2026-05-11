const express = require("express");
const router = express.Router();
const { login, verifyOtp, getMe } = require("../controllers/authController");
const { validateLogin } = require("../validations/authValidation");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/login", validateLogin, login);
router.post("/verify-otp", verifyOtp);
router.get("/me", authMiddleware, getMe);

module.exports = router;
