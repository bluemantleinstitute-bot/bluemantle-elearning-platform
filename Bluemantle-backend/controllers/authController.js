const User = require("../models/user");
const { comparePassword } = require("../utils/hashPassword");
const generateToken = require("../utils/generateToken");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

// Helper for HTTP-only cookie
const setTokenCookie = (res, token) => {
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
};

const setRoleCookie = (res, role) => {
    res.cookie("user_role", role, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000
    });
};

const setUserNameCookie = (res, name) => {
    res.cookie("user_name", name, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000
    });
};

// Login a user
exports.login = async (req, res) => {
    try {
        const { userId, password, deviceId } = req.body; 
        
        // Frontend uses 'userId' but DB uses 'signInId'
        const signInId = userId || req.body.signInId;

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
        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        // Device-Based Access Control logic (Applicable only to students)
        const incomingDeviceId = deviceId || crypto.createHash('md5').update(req.ip + req.headers['user-agent']).digest('hex');

        if (user.role === "student") {
            if (!user.deviceId) {
                // First time login or after admin unlink, bind device
                user.deviceId = incomingDeviceId;
            } else if (user.deviceId !== incomingDeviceId) {
                // Strict device locking
                return res.status(403).json({ 
                    success: false, 
                    message: "Access Denied: Your account is locked to a specific device. Please contact administration to request a device unlink." 
                });
            }
        }
        
        // Single Session Enforcement: Generate activeToken
        const activeToken = crypto.randomBytes(32).toString('hex');
        user.activeToken = activeToken;
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
        
        // Update device and clear OTP
        user.deviceId = incomingDeviceId;
        user.otp = null;
        user.otpExpires = null;
        
        const activeToken = crypto.randomBytes(32).toString('hex');
        user.activeToken = activeToken;
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
        const user = await User.findById(req.user.id).select("-password -plainPassword -activeToken");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
