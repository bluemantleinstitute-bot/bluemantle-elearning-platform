require("dotenv").config();
const dns = require("dns");

const dnsServers = (process.env.DNS_SERVERS || "1.1.1.1,8.8.8.8")
  .split(",")
  .map((server) => server.trim())
  .filter(Boolean);

dns.setServers(dnsServers);

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const validateEnv = require("./config/envValidator");
const connectDB = require("./config/db");
const initScheduler = require("./utils/scheduler");


const rateLimit = require("express-rate-limit");
const app = express();
const helmet = require("helmet");
const testRoutes = require("./routes/testRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const courseRoutes = require("./routes/courseRoutes");
const moduleRoutes = require("./routes/moduleRoutes");
const videoRoutes = require("./routes/videoRoutes");
const noteRoutes = require("./routes/noteRoutes");
const batchRoutes = require("./routes/batchRoutes");
const liveClassRoutes = require("./routes/liveClassRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const progressRoutes = require("./routes/progressRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const institutionalRoutes = require("./routes/institutionalRoutes");
const userRoutes = require("./routes/userRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const doubtRoutes = require("./routes/doubtRoutes");
const zoomRoutes = require("./routes/zoomRoutes");

const allowedOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Validate environment variables before anything else
validateEnv();
// Connect to MongoDB
connectDB();
// Initialize Cron Scheduler
initScheduler();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));
app.use(helmet());

// Rate Limiting (Prevent brute-force)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 1000, // Increased limit for development/active sessions
  message: "Too many requests from this IP, please try again later",
  standardHeaders: "draft-7", 
  legacyHeaders: false,
});

app.use("/api", apiLimiter);

// Routes
app.use("/api/test", testRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/classes", liveClassRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/institutional", institutionalRoutes);
app.use("/api/users", userRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/doubts", doubtRoutes);
app.use("/api/zoom", zoomRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API running...",
    data: {}
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`); 
});
