const jwt = require("jsonwebtoken");
const User = require("../models/user");

const authMiddleware = async (req, res, next) => {
    try {
        let token;
        
        // 1. Check HTTP-only cookie
        if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        } 
        // 2. Fallback to Authorization Header
        else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }

        // Check if token exists
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: No token provided"
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret");

        // Fetch User and check inactivity timeout
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized: User not found" });
        }

        // Single Session Enforcement check
        if (user.activeToken !== decoded.activeToken) {
            // Token does not match the active session, user logged in elsewhere
            res.clearCookie("token");
            return res.status(401).json({
                success: false,
                message: "Session expired. You logged in from another device."
            });
        }

        const now = new Date();
        const studentTimeout = 30 * 60 * 1000;
        const facultyTimeout = 12 * 60 * 60 * 1000; // 12 hours for teachers/admins
        const timeoutLimit = (user.role === 'teacher' || user.role === 'admin' || user.role === 'owner') 
            ? facultyTimeout 
            : studentTimeout;

        const timeSinceLastActive = now.getTime() - new Date(user.lastActive).getTime();

        if (timeSinceLastActive > timeoutLimit) {
            return res.status(401).json({
                success: false,
                message: "Session expired due to inactivity"
            });
        }

        // Optimize DB calls: update only if at least 1 minute has passed since last update
        // to avoid unnecessary saves on high frequency requests.
        const oneMinuteMs = 1 * 60 * 1000;
        if (timeSinceLastActive > oneMinuteMs) {
            user.lastActive = now;
            await user.save();
        }

        // Attach user to request
        req.user = decoded;
        req.userDb = user; // Attach DB user to avoid refetching in controllers

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: Invalid token"
        });
    }
};

module.exports = authMiddleware;