const jwt = require("jsonwebtoken");
const User = require("../models/user");

const isHttpsDeployment =
    process.env.NODE_ENV === "production" ||
    process.env.RENDER === "true" ||
    (process.env.FRONTEND_URL || "").startsWith("https://");

const clearCookieOptions = {
    secure: isHttpsDeployment,
    sameSite: isHttpsDeployment ? "none" : "lax",
    path: "/",
};

const isFacultyAccount = (role) => ["teacher", "admin", "owner"].includes(role);

const clearTokenCookie = (res) => {
    res.clearCookie("token", { ...clearCookieOptions, httpOnly: true });
};

const authMiddleware = async (req, res, next) => {
    try {
        let token;

        if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        } else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: No token provided",
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized: User not found" });
        }

        if (isFacultyAccount(user.role)) {
            const sessionIndex = (user.activeSessions || []).findIndex((session) => session.token === decoded.activeToken);
            const isLegacySession = user.activeToken && user.activeToken === decoded.activeToken;

            if (sessionIndex === -1 && !isLegacySession) {
                clearTokenCookie(res);
                return res.status(401).json({
                    success: false,
                    message: "Session expired. Please sign in again.",
                });
            }

            if (isLegacySession && sessionIndex === -1) {
                user.activeSessions = [
                    {
                        token: decoded.activeToken,
                        deviceId: "",
                        userAgent: req.headers["user-agent"] || "",
                        lastActive: new Date(),
                        createdAt: new Date(),
                    },
                ];
            }
        } else if (user.activeToken !== decoded.activeToken) {
            clearTokenCookie(res);
            return res.status(401).json({
                success: false,
                message: "Session expired. You logged in from another device.",
            });
        }

        const now = new Date();
        const studentTimeout = 30 * 60 * 1000;
        const facultyTimeout = 12 * 60 * 60 * 1000;
        const timeoutLimit = isFacultyAccount(user.role) ? facultyTimeout : studentTimeout;
        const timeSinceLastActive = now.getTime() - new Date(user.lastActive).getTime();

        if (timeSinceLastActive > timeoutLimit) {
            return res.status(401).json({
                success: false,
                message: "Session expired due to inactivity",
            });
        }

        const oneMinuteMs = 1 * 60 * 1000;
        if (timeSinceLastActive > oneMinuteMs) {
            user.lastActive = now;
            if (isFacultyAccount(user.role)) {
                const session = (user.activeSessions || []).find((item) => item.token === decoded.activeToken);
                if (session) session.lastActive = now;
            }
            await user.save();
        }

        req.user = decoded;
        req.userDb = user;

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: Invalid token",
        });
    }
};

module.exports = authMiddleware;
