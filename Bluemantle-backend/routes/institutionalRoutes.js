const express = require("express");
const router = express.Router();
const institutionalController = require("../controllers/institutionalController");
const authMiddleware = require("../middleware/authMiddleware");

// Apply authentication middleware to all institutional routes
router.use(authMiddleware);

// GET full registry payload
router.get("/", institutionalController.getRegistry);

// POST dispatch action payload
router.post("/", institutionalController.dispatchAction);

module.exports = router;
