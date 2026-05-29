const User = require("../models/user");
const { getStudentCourseScope } = require("../utils/courseAccess");

const courseAccessMiddleware = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const courseId = req.params.id || req.params.courseId;

        // Admin, owner, and teacher can access courses for management/teaching.
        if (["admin", "owner", "teacher"].includes(req.user.role)) {
            return next();
        }

        const user = await User.findById(userId).select("_id batchId enrolledCourses").lean();
        if (!user) {
            return res.status(401).json({ success: false, message: "User not found" });
        }

        const scope = await getStudentCourseScope(user);
        if (!scope.courseIds.includes(courseId.toString())) {
            return res.status(403).json({
                success: false,
                message: "Access denied. Course is not assigned to your batch."
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error verifying course access" });
    }
};

module.exports = courseAccessMiddleware;
