const User = require("../models/user");
const Batch = require("../models/Batch");
const Attendance = require("../models/Attendance");
const Progress = require("../models/Progress");
const Doubt = require("../models/Doubt");
const Appeal = require("../models/Appeal");
const LiveClass = require("../models/LiveClass");
const Note = require("../models/Note");
const { hashPassword } = require("../utils/hashPassword");
const crypto = require("crypto");


exports.createUser = async (req, res) => {
    try {
        let { name, email, userId, password, role, batchId, title } = req.body;
        
        // Auto-generate credentials if not provided
        if (!userId) {
            userId = `STU-${Math.floor(100000 + Math.random() * 900000)}`;
        }
        if (!password) {
            const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            const lowercase = "abcdefghijklmnopqrstuvwxyz";
            const numbers = "0123456789";
            const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";
            const all = uppercase + lowercase + numbers + symbols;
            
            let pass = "";
            pass += uppercase.charAt(crypto.randomInt(0, uppercase.length));
            pass += lowercase.charAt(crypto.randomInt(0, lowercase.length));
            pass += numbers.charAt(crypto.randomInt(0, numbers.length));
            pass += symbols.charAt(crypto.randomInt(0, symbols.length));
            
            for (let i = 0; i < 8; i++) {
                pass += all.charAt(crypto.randomInt(0, all.length));
            }
            
            password = pass.split('').sort(() => Math.random() - 0.5).join('');
        }


        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ signInId: userId }, { email }] });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User with this ID or Email already exists" });
        }

        const hashedPassword = await hashPassword(password);

        const newUser = new User({
            name,
            email,
            signInId: userId,
            password: hashedPassword,
            plainPassword: password, // Store plain password for admin retrieval
            role: role || "student",
            batchId: batchId || null,
            status: "active",
            title: title || ""
        });

        await newUser.save();

        // If batchId provided, add student to batch
        if (batchId) {
            await Batch.findByIdAndUpdate(batchId, { $addToSet: { students: newUser._id } });
        }

        res.status(201).json({
            success: true,
            message: "User successfully created",
            user: {
                userId: newUser.signInId,
                password: password, // Return plain password for immediate copy
                name: newUser.name
            }
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


exports.getUsers = async (req, res) => {
    try {
        const { role, batchId } = req.query;
        let filter = {};
        if (role) {
            filter.role = role;
        }
        if (batchId) {
            filter.batchId = batchId;
        }

        const users = await User.find(filter).populate("batchId", "name").lean();
        
        const formattedUsers = await Promise.all(users.map(async user => {
            let batchesCount = 0;
            if (user.role === "teacher") {
                batchesCount = await Batch.countDocuments({ teacherId: user._id });
            }
            const activeSessions = (user.activeSessions || []).map(session => ({
                deviceId: session.deviceId,
                userAgent: session.userAgent,
                lastActive: session.lastActive,
                createdAt: session.createdAt
            }));
            return {
                id: user._id,
                name: user.name,
                email: user.email,
                userId: user.signInId,
                password: user.plainPassword, // Include plain password for admin
                role: user.role,
                cohort: user.batchId ? user.batchId.name : null,
                batchId: user.batchId ? user.batchId._id : null,
                status: user.status,
                title: user.title,
                description: user.description,
                linkedin: user.linkedin,
                mobileNumber: user.mobileNumber,
                profilePicture: user.profilePicture,
                level: user.level,
                totalXP: user.totalXP,
                lastActive: user.lastActive,
                batches: batchesCount,
                deviceId: user.deviceId,
                deviceStatus: user.deviceStatus,
                activeSessions,
                sessionCount: activeSessions.length
            };
        }));


        res.json({
            success: true,
            users: formattedUsers
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateUserProfileByAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const allowedFields = ["name", "email", "title", "description", "linkedin", "mobileNumber", "profilePicture"];
        const updates = {};

        allowedFields.forEach(field => {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                updates[field] = req.body[field] || "";
            }
        });

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (user.role !== "teacher") {
            return res.status(403).json({ success: false, message: "Only teacher profiles can be edited from this panel." });
        }

        Object.assign(user, updates);
        await user.save();

        res.json({
            success: true,
            message: "Teacher profile updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                userId: user.signInId,
                role: user.role,
                status: user.status,
                title: user.title,
                description: user.description,
                linkedin: user.linkedin,
                mobileNumber: user.mobileNumber,
                profilePicture: user.profilePicture,
                lastActive: user.lastActive,
                activeSessions: (user.activeSessions || []).map(session => ({
                    deviceId: session.deviceId,
                    userAgent: session.userAgent,
                    lastActive: session.lastActive,
                    createdAt: session.createdAt
                })),
                sessionCount: (user.activeSessions || []).length
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.clearUserSessions = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (!["teacher", "admin", "owner"].includes(user.role)) {
            return res.status(403).json({ success: false, message: "Use device unlink for student accounts." });
        }

        user.activeSessions = [];
        user.activeToken = null;
        user.lastActive = Date.now();
        await user.save();

        res.json({
            success: true,
            message: "Active sessions cleared. The account can sign in again from a fresh device."
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getStudentsByBatch = async (req, res) => {
    try {
        const { batchId } = req.params;
        const students = await User.find({ role: "student", batchId }).populate("batchId", "name").lean();
        
        const formattedStudents = students.map(student => ({
            id: student._id,
            name: student.name,
            email: student.email,
            userId: student.signInId,
            password: student.plainPassword,
            cohort: student.batchId ? student.batchId.name : null,
            status: student.status,
            level: student.level,
            totalXP: student.totalXP
        }));


        res.json({
            success: true,
            students: formattedStudents
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ["active", "suspended", "pending", "blocked"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status value" });
        }

        const user = await User.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        ).lean();

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.json({
            success: true,
            message: `User status updated to ${status}`,
            user: { id: user._id, name: user.name, status: user.status }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.unlinkDevice = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        user.deviceId = null;
        user.deviceStatus = "None";
        user.activeToken = null;
        await user.save();
        
        res.json({ success: true, message: "Device unlinked successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (id === req.user.id) {
            return res.status(400).json({ success: false, message: "You cannot delete your own account." });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (!["student", "teacher"].includes(user.role)) {
            return res.status(403).json({ success: false, message: "Only student and teacher accounts can be deleted here." });
        }

        if (user.role === "teacher") {
            const activeClass = await LiveClass.findOne({
                teacherId: user._id,
                status: { $in: ["scheduled", "live"] }
            }).select("_id topic status");

            if (activeClass) {
                return res.status(409).json({
                    success: false,
                    message: "This teacher has scheduled or live classes. Reassign or finish those sessions before deleting."
                });
            }

            await Batch.updateMany({ teacherId: user._id }, { $unset: { teacherId: "" } });
            await Doubt.updateMany(
                { instructorId: user._id, status: { $ne: "Resolved" } },
                { $set: { instructorId: null } }
            );
            await Note.updateMany({ uploadedBy: user._id }, { $unset: { uploadedBy: "" } });
        }

        if (user.role === "student") {
            await Batch.updateMany(
                { students: user._id },
                { $pull: { students: user._id } }
            );
            await Attendance.deleteMany({ studentId: user._id });
            await Progress.deleteMany({ userId: user._id });
            await Doubt.deleteMany({ studentId: user._id });
            await Appeal.deleteMany({ studentId: user._id });
            await Note.updateMany(
                {},
                {
                    $pull: {
                        unlockedForStudents: user._id,
                        accessLog: { studentId: user._id }
                    }
                }
            );
        }

        await User.findByIdAndDelete(user._id);

        res.json({
            success: true,
            message: `${user.role === "teacher" ? "Teacher" : "Student"} account deleted successfully`
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


exports.listTeachers = async (req, res) => {
    try {
        const teachers = await User.find({ role: "teacher", status: "active" })
            .select("name email title description linkedin mobileNumber profilePicture")
            .lean();
        res.json({ success: true, data: teachers });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
