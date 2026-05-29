const User = require("../models/user");
const { comparePassword } = require("../utils/hashPassword");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const isHttpsDeployment =
    process.env.NODE_ENV === "production" ||
    process.env.RENDER === "true" ||
    (process.env.FRONTEND_URL || "").startsWith("https://");

const sameSite = isHttpsDeployment ? "none" : "lax";
const secure = isHttpsDeployment;

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: 24 * 60 * 60 * 1000,
};

const COOKIE_OPTIONS_PUBLIC = {
    httpOnly: false,
    secure,
    sameSite,
    maxAge: 24 * 60 * 60 * 1000,
};

const CLEAR_COOKIE_OPTIONS = {
    secure,
    sameSite,
    path: "/",
};

const CLIENT_DEVICE_PREFIX = "bmit-device-";

const setTokenCookie = (res, token) => res.cookie("token", token, COOKIE_OPTIONS);
const setRoleCookie = (res, role) => res.cookie("user_role", role, COOKIE_OPTIONS_PUBLIC);
const setUserNameCookie = (res, name) => res.cookie("user_name", name, COOKIE_OPTIONS_PUBLIC);

const clearAuthCookies = (res) => {
    res.clearCookie("token", { ...CLEAR_COOKIE_OPTIONS, httpOnly: true });
    res.clearCookie("user_role", { ...CLEAR_COOKIE_OPTIONS, httpOnly: false });
    res.clearCookie("user_name", { ...CLEAR_COOKIE_OPTIONS, httpOnly: false });
};

const isFacultyAccount = (role) => ["teacher", "admin", "owner"].includes(role);

const isClientDeviceId = (deviceId) => {
    return typeof deviceId === "string" && deviceId.startsWith(CLIENT_DEVICE_PREFIX);
};

const makeFallbackDeviceId = (req) => {
    return crypto
        .createHash("sha256")
        .update(`${req.ip || ""}:${req.headers["user-agent"] || ""}`)
        .digest("hex");
};

const registerSession = (user, activeToken, incomingDeviceId, userAgent) => {
    const now = new Date();

    if (isFacultyAccount(user.role)) {
        const sessions = Array.isArray(user.activeSessions) ? user.activeSessions : [];
        user.activeSessions = [
            ...sessions.filter((session) => session.token !== activeToken),
            {
                token: activeToken,
                deviceId: incomingDeviceId,
                userAgent: userAgent || "",
                lastActive: now,
                createdAt: now,
            },
        ]
            .sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime())
            .slice(0, 3);
        user.activeToken = user.activeSessions[0]?.token || activeToken;
        return;
    }

    user.activeToken = activeToken;
    user.activeSessions = [
        {
            token: activeToken,
            deviceId: incomingDeviceId,
            userAgent: userAgent || "",
            lastActive: now,
            createdAt: now,
        },
    ];
};

exports.login = async (req, res) => {
    try {
        const { userId, password, deviceId } = req.body;
        const signInId = userId || req.body.signInId;

        if (!signInId || !password) {
            return res.status(400).json({ success: false, message: "Please provide userId and password" });
        }

        const user = await User.findOne({ signInId });
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const incomingDeviceId = deviceId || makeFallbackDeviceId(req);

        if (user.role === "student") {
            if (!user.deviceId) {
                user.deviceId = incomingDeviceId;
            } else if (isClientDeviceId(incomingDeviceId) && !isClientDeviceId(user.deviceId)) {
                // Migrate old proxy/IP based locks to the stable browser device id.
                user.deviceId = incomingDeviceId;
            } else if (user.deviceId !== incomingDeviceId) {
                return res.status(403).json({
                    success: false,
                    message: "Access Denied: Your account is locked to a specific device. Please contact administration to request a device unlink.",
                });
            }
        }

        const activeToken = crypto.randomBytes(32).toString("hex");
        registerSession(user, activeToken, incomingDeviceId, req.headers["user-agent"]);
        user.lastActive = Date.now();
        await user.save();

        const tokenPayload = { id: user._id, role: user.role, activeToken };
        const finalToken = jwt.sign(tokenPayload, process.env.JWT_SECRET || "default_secret", { expiresIn: "1d" });

        setTokenCookie(res, finalToken);
        setRoleCookie(res, user.role);
        setUserNameCookie(res, user.name);

        res.json({
            success: true,
            token: finalToken,
            user: {
                userId: user.signInId,
                name: user.name,
                role: user.role,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        const { userId, otp, deviceId } = req.body;
        const signInId = userId || req.body.signInId;

        const user = await User.findOne({ signInId });
        if (!user || !user.otp || user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(401).json({ success: false, message: "Invalid or expired OTP" });
        }

        const incomingDeviceId = deviceId || makeFallbackDeviceId(req);

        if (user.role === "student") {
            user.deviceId = incomingDeviceId;
        }
        user.otp = null;
        user.otpExpires = null;

        const activeToken = crypto.randomBytes(32).toString("hex");
        registerSession(user, activeToken, incomingDeviceId, req.headers["user-agent"]);
        user.lastActive = Date.now();
        await user.save();

        const finalToken = jwt.sign({ id: user._id, role: user.role, activeToken }, process.env.JWT_SECRET || "default_secret", { expiresIn: "1d" });

        setTokenCookie(res, finalToken);
        setRoleCookie(res, user.role);
        setUserNameCookie(res, user.name);

        res.json({
            success: true,
            token: finalToken,
            user: {
                userId: user.signInId,
                name: user.name,
                role: user.role,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password -plainPassword -activeToken -activeSessions");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.logout = async (req, res) => {
    try {
        let token;
        if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        } else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
                if (decoded?.id && decoded?.activeToken) {
                    await User.findByIdAndUpdate(decoded.id, {
                        $pull: { activeSessions: { token: decoded.activeToken } },
                        ...(decoded.role === "student" ? { activeToken: null } : {}),
                    });
                }
            } catch (_) {
                // Logout must remain idempotent even when token is already invalid.
            }
        }

        clearAuthCookies(res);
        res.json({ success: true, message: "Logged out successfully" });
    } catch (err) {
        clearAuthCookies(res);
        res.status(200).json({ success: true, message: "Logged out" });
    }
};
