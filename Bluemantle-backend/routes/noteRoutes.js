const express = require("express");
const router = express.Router();

const {
  createNote,
  getStudentNotes,
  getAllNotes,
  accessResource,
  updateNote,
  overrideResourceAccess,
  deleteNote
} = require("../controllers/noteController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Admin and Teacher create note
router.get("/", authMiddleware, roleMiddleware("admin", "owner", "teacher"), getAllNotes);
router.post("/", authMiddleware, roleMiddleware("admin", "owner", "teacher"), createNote);

// Student get my notes
router.get("/my-notes", authMiddleware, getStudentNotes);
router.get("/:id/access", authMiddleware, accessResource);
router.put("/:id", authMiddleware, roleMiddleware("admin", "owner", "teacher"), updateNote);
router.post("/:id/override", authMiddleware, roleMiddleware("admin", "owner", "teacher"), overrideResourceAccess);
router.delete("/:id", authMiddleware, roleMiddleware("admin", "owner", "teacher"), deleteNote);

module.exports = router;
