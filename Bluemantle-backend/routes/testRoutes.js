const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Protected route (any logged-in user)
router.get("/protected", authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: "You are authorized",
        data: {
            user: req.user
        }
    });
});

// Admin-only route
router.get("/admin", authMiddleware, roleMiddleware("admin"), (req, res) => {
    res.json({
        success: true,
        message: "Welcome Admin",
        data: {}
    });
});

// Test zoom route
router.get("/zoom", async (req, res) => {
    try {
        const zoomHelper = require("../utils/zoomHelper");
        const zoomData = await zoomHelper.createZoomMeeting({
            topic: "Test Class from API",
            startTime: new Date(Date.now() + 86400000).toISOString(),
            duration: 60,
            teacherEmail: undefined
        });
        res.json({ success: true, zoomData });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

module.exports = router;