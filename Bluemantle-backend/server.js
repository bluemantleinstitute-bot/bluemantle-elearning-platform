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
const path = require("path");
const validateEnv = require("./config/envValidator");
const connectDB = require("./config/db");
const initScheduler = require("./utils/scheduler");

const rateLimit = require("express-rate-limit");
const app = express();
const helmet = require("helmet");

// FIX 1: Trust Render's reverse proxy so express-rate-limit
// can read X-Forwarded-For without throwing a ValidationError
app.set("trust proxy", 1);

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

// FIX 2: Normalise origins so trailing slashes never cause a mismatch
const normalizeOrigin = (origin) => origin.replace(/\/+$/, "");

const defaultAllowedOrigins = [
  "https://bmit-5od1.vercel.app",
  ...(process.env.NODE_ENV === "production"
    ? []
    : ["http://localhost:3000", "http://127.0.0.1:3000"]),
].join(",");

const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  process.env.FRONTEND_URL ||
  defaultAllowedOrigins
)
  .split(",")
  .map((origin) => origin.trim())
  .map(normalizeOrigin)
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
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// FIX 3: CORS with normalised origin comparison + explicit methods/headers
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(normalizeOrigin(origin))) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(helmet());

// Rate Limiting (Prevent brute-force)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 1000,
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

// Root probe
app.get("/", (req, res) => {
  res.json({ success: true, message: "API running...", data: {} });
});

// FIX 4: Health endpoint for UptimeRobot keep-alive pings
// so the free Render instance never goes to sleep
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
