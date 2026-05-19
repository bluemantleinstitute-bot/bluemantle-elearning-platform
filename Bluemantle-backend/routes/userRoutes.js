const express = require("express");
const router = express.Router();
const { createUser, getUsers, getStudentsByBatch, updateUserStatus, unlinkDevice, deleteUser } = require("../controllers/userController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.post("/", authMiddleware, roleMiddleware("admin", "owner"), createUser);
router.get("/", authMiddleware, roleMiddleware("admin", "owner"), getUsers);
router.patch("/:id/status", authMiddleware, roleMiddleware("admin", "owner"), updateUserStatus);
router.patch("/:id/unlink-device", authMiddleware, roleMiddleware("admin", "owner"), unlinkDevice);
router.delete("/:id", authMiddleware, roleMiddleware("admin", "owner"), deleteUser);
router.get("/students/batch/:batchId", authMiddleware, getStudentsByBatch);
router.get("/teachers", authMiddleware, require("../controllers/userController").listTeachers);


module.exports = router;
