const User = require("../models/user");

exports.updateProfile = async (req, res) => {
    try {
        const { name, email, linkedin, description, title, profilePicture, mobileNumber } = req.body;
        const userId = req.user.id; // from authMiddleware

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Only teachers should update this (or admin)
        if (user.role !== "teacher" && user.role !== "admin" && user.role !== "owner") {
            return res.status(403).json({ success: false, message: "Only teachers can update teacher profiles" });
        }

        if (name !== undefined) user.name = name;
        if (email !== undefined) user.email = email;
        if (linkedin !== undefined) user.linkedin = linkedin;
        if (description !== undefined) user.description = description;
        if (title !== undefined) user.title = title;
        if (profilePicture !== undefined) user.profilePicture = profilePicture;
        if (mobileNumber !== undefined) user.mobileNumber = mobileNumber;

        await user.save();

        res.json({
            success: true,
            message: "Profile updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                title: user.title,
                linkedin: user.linkedin,
                mobileNumber: user.mobileNumber,
                description: user.description,
                profilePicture: user.profilePicture
            }
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select("name email role title linkedin mobileNumber description profilePicture")
            .lean();

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (user.role !== "teacher" && user.role !== "admin" && user.role !== "owner") {
            return res.status(403).json({ success: false, message: "Only teachers can access teacher profiles" });
        }

        res.json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.listPublicTeacherProfiles = async (_req, res) => {
    try {
        const teachers = await User.find({ role: "teacher", status: "active" })
            .select("name email title linkedin mobileNumber description profilePicture")
            .sort({ name: 1 })
            .lean();

        res.json({ success: true, data: teachers });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.clearOtherSessions = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (user.role !== "teacher" && user.role !== "admin" && user.role !== "owner") {
            return res.status(403).json({ success: false, message: "Only teachers and admins can manage faculty sessions" });
        }

        user.activeSessions = (user.activeSessions || []).filter((session) => session.token === req.user.activeToken);
        user.activeToken = req.user.activeToken;
        await user.save();

        res.json({ success: true, message: "Other devices cleared successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
