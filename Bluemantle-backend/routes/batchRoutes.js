const express = require("express");
const router = express.Router();

const { 
    createBatch, 
    listBatches, 
    updateBatch,
    getBatchDetails, 
    assignTeacher,
    removeTeacher,
    addStudents, 
    removeStudent 
} = require("../controllers/batchController");


const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Admin routes
router.post("/", authMiddleware, roleMiddleware("admin", "owner"), createBatch);
router.get("/", authMiddleware, roleMiddleware("admin", "owner"), listBatches);
router.put("/:id", authMiddleware, roleMiddleware("admin", "owner"), updateBatch);

router.post("/:id/assign-teacher", authMiddleware, roleMiddleware("admin", "owner"), assignTeacher);
router.post("/:id/remove-teacher", authMiddleware, roleMiddleware("admin", "owner"), removeTeacher);
router.post("/:id/add-students", authMiddleware, roleMiddleware("admin", "owner"), addStudents);
router.post("/:id/remove-student", authMiddleware, roleMiddleware("admin", "owner"), removeStudent);

// Authenticated viewing route (authorization handled intimately in the controller)
router.get("/:id", authMiddleware, getBatchDetails);

module.exports = router;
