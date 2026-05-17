const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "../public/uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.post("/", upload.single("file"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }
        
        // Return public URL (assuming express.static is set up for 'public' folder)
        const fileUrl = `/uploads/${req.file.filename}`;
        
        res.json({
            success: true,
            message: "File uploaded successfully",
            url: fileUrl
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Upload failed" });
    }
});

module.exports = router;
