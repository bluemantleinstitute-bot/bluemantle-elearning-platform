const express = require("express");
const router = express.Router();

const { addVideo, updateVideo, deleteVideo, getVideo, getAllVideos } = require("../controllers/videoController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Admin and Teacher manage videos
router.get("/", authMiddleware, roleMiddleware("admin", "teacher"), getAllVideos);
router.post("/", authMiddleware, roleMiddleware("admin", "teacher"), addVideo);
router.put("/:id", authMiddleware, roleMiddleware("admin", "teacher"), updateVideo);
router.delete("/:id", authMiddleware, roleMiddleware("admin", "teacher"), deleteVideo);

// Students get video with sequential access check
router.get("/:id", authMiddleware, getVideo);

module.exports = router;