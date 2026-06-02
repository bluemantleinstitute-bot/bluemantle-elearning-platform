const User = require("../models/user");
const { comparePassword, hashPassword } = require("../utils/hashPassword");
const generateToken = require("../utils/generateToken");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

// FIX: sameSite must be "none" (not "strict") because the frontend (vercel.app)
// and backend (onrender.com) are on different domains. "strict" silently blocks
// all cross-origin cookies, so the session token never reaches the browser.
// sameSite "none" requires secure:true, which is already set in production.
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,           // always true — both domains are HTTPS
  sameSite: "none",       // required for cross-origin cookie delivery
  maxAge: 24 * 60 * 60 * 1000, // 1 day
};

const COOKIE_OPTIONS_PUBLIC = {
  httpOnly: false,        // readable by JS (role, name)
  secure: true,
  sameSite: "none",
  maxAge: 24 * 60 * 60 * 1000,
};

const setTokenCookie    = (res, token) => res.cookie("token",     token, COOKIE_OPTIONS);
const setRoleCookie     = (res, role)  => res.cookie("user_role", role,  COOKIE_OPTIONS_PUBLIC);
const setUserNameCookie = (res, name)  => res.cookie("user_name", name,  COOKIE_OPTIONS_PUBLIC);
const clearAuthCookies = (res) => {
    res.clearCookie("token", { httpOnly: true, secure: true, sameSite: "none", path: "/" });
    res.clearCookie("user_role", { httpOnly: false, secure: true, sameSite: "none", path: "/" });
    res.clearCookie("user_name", { httpOnly: false, secure: true, sameSite: "none", path: "/" });
};

const isBcryptHash = (value) => typeof value === "string" && /^\$2[aby]\$/.test(value);

const verifyAndRepairPassword = async (user, enteredPassword) => {
    const passwordText = String(enteredPassword || "");
    let isMatch = false;

    if (user.password) {
        isMatch = isBcryptHash(user.password)
            ? await comparePassword(passwordText, user.password)
            : user.password === passwordText;
    }

    const matchesStoredPlainPassword = !isMatch && user.plainPassword === passwordText;
    if (!isMatch && !matchesStoredPlainPassword) {
        return false;
    }

    if (!isBcryptHash(user.password) || matchesStoredPlainPassword) {
        user.password = await hashPassword(passwordText);
        user.plainPassword = passwordText;
    }

    return true;
};

const isFacultyAccount = (role) => ["teacher", "admin", "owner"].includes(role);

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
            }
        ]
            .sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime())
            .slice(0, 3);
        user.activeToken = user.activeSessions[0]?.token || activeToken;
        return;
    }

    user.activeToken = activeToken;
    user.activeSessions = [{
        token: activeToken,
        deviceId: incomingDeviceId,
        userAgent: userAgent || "",
        lastActive: now,
        createdAt: now,
    }];
};

// Login a user
exports.login = async (req, res) => {
    try {
        const { userId, password, deviceId } = req.body; 
        
        // Frontend uses 'userId' but DB uses 'signInId'
        const signInId = String(userId || req.body.signInId || "").trim();

        // Basic validation
        if (!signInId || !password) {
            return res.status(400).json({ success: false, message: "Please provide userId and password" });
        }

        // Find user by signInId
        const user = await User.findOne({ signInId });
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        // Verify password
        const isMatch = await verifyAndRepairPassword(user, password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        // Keep a soft session fingerprint for audit/session metadata only.
        // Students are no longer blocked by stored deviceId.
        const incomingDeviceId = deviceId || crypto.createHash('md5').update(req.ip + req.headers['user-agent']).digest('hex');
        
        // Session Enforcement: students stay single-device/single-session, faculty/admin keep up to 3 sessions.
        const activeToken = crypto.randomBytes(32).toString('hex');
        registerSession(user, activeToken, incomingDeviceId, req.headers['user-agent']);
        user.lastActive = Date.now();
        await user.save();

        // Generate JWT token (Payload includes the activeToken for verification middleware)
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
                role: user.role
            }
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

        const incomingDeviceId = deviceId || crypto.createHash('md5').update(req.ip + req.headers['user-agent']).digest('hex');
        
        // Clear OTP. Device IDs are no longer used to lock student access.
        user.otp = null;
        user.otpExpires = null;
        
        const activeToken = crypto.randomBytes(32).toString('hex');
        registerSession(user, activeToken, incomingDeviceId, req.headers['user-agent']);
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
                role: user.role
            }
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
                        ...(decoded.role === "student" ? { activeToken: null } : {})
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
