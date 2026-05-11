const User = require("../models/user");

exports.updateProfile = async (req, res) => {
    try {
        const { name, email, linkedin, description, title } = req.body;
        const userId = req.user.id; // from authMiddleware

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Only teachers should update this (or admin)
        if (user.role !== "teacher" && user.role !== "admin" && user.role !== "owner") {
            return res.status(403).json({ success: false, message: "Only teachers can update teacher profiles" });
        }

        if (name) user.name = name;
        if (email) user.email = email;
        if (linkedin) user.linkedin = linkedin;
        if (description) user.description = description;
        if (title) user.title = title;

        await user.save();

        res.json({
            success: true,
            message: "Profile updated successfully"
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
