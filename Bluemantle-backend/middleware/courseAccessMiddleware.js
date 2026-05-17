const User = require("../models/user");

const courseAccessMiddleware = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const courseId = req.params.id || req.params.courseId;

        // Admin and Teacher can access all courses for management/teaching
        if (req.user.role === "admin" || req.user.role === "teacher") {
            return next();
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({ success: false, message: "User not found" });
        }

        // Check enrollment
        if (!user.enrolledCourses || !user.enrolledCourses.includes(courseId)) {
            return res.status(403).json({
                success: false,
                message: "Access denied. Course not enrolled."
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error verifying course access" });
    }
};

module.exports = courseAccessMiddleware;
