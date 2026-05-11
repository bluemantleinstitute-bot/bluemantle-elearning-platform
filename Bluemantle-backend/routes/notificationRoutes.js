const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markAsRead
} = require("../controllers/notificationController");
const auth = require("../middleware/authMiddleware");

// GET all notifications for the authenticated user
router.get("/", auth, getNotifications);

// POST to mark notifications as read
router.post("/read", auth, markAsRead);

module.exports = router;
