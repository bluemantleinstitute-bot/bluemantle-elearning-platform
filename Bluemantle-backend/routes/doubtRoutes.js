const express = require("express");
const router = express.Router();
const doubtController = require("../controllers/doubtController");
const auth = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Student routes
router.post("/submit", auth, roleMiddleware("student"), doubtController.submitDoubt);
router.get("/my-doubts", auth, roleMiddleware("student"), doubtController.getMyDoubts);

// Admin/Teacher routes
router.get("/all", auth, roleMiddleware("teacher", "admin", "owner"), doubtController.getAllDoubts);
router.put("/respond/:id", auth, roleMiddleware("teacher", "admin", "owner"), doubtController.respondToDoubt);
router.get("/stats", auth, roleMiddleware("admin", "owner"), doubtController.getDoubtStats);

module.exports = router;
