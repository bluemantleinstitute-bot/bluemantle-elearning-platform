const User = require("../models/user");
const Batch = require("../models/Batch");
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
                level: user.level,
                totalXP: user.totalXP,
                lastActive: user.lastActive,
                batches: batchesCount,
                deviceId: user.deviceId,
                deviceStatus: user.deviceStatus
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


exports.listTeachers = async (req, res) => {
    try {
        const teachers = await User.find({ role: "teacher", status: "active" })
            .select("name title description linkedin")
            .lean();
        res.json({ success: true, data: teachers });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
