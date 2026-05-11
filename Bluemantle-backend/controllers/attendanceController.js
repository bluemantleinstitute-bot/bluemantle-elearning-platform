const Attendance = require("../models/Attendance");
const LiveClass = require("../models/LiveClass");

exports.markAttendance = async (req, res) => {
    try {
        const { classId, records } = req.body; 
        // Array of { studentId, status }
        
        if (!classId || !Array.isArray(records)) {
            return res.status(400).json({ success: false, message: "Missing classId or records array" });
        }

        const liveClass = await LiveClass.findById(classId);
        if (!liveClass) return res.status(404).json({ success: false, message: "Live Class not found" });

        // Teacher check: Only the assigned teacher of the class can mark attendance
        if (liveClass.teacherId?.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: "Access denied. You are not the teacher for this class." });
        }

        const ops = records.map(record => ({
            updateOne: {
                filter: { classId, studentId: record.studentId },
                update: { $set: { status: record.status } },
                upsert: true
            }
        }));

        await Attendance.bulkWrite(ops);

        res.json({ success: true, message: "Attendance marked successfully", data: {} });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "Duplicate attendance records prevented." });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getStudentAttendance = async (req, res) => {
    try {
        const studentId = req.params.id || req.user.id;
        
        // Ensure students only view their own
        if (req.user.role === "student" && studentId !== req.user.id) {
            return res.status(403).json({ success: false, message: "Access denied." });
        }

        const attendance = await Attendance.find({ studentId }).populate("classId", "topic date zoomLink");
        res.json({ success: true, message: "Attendance retrieved successfully", data: attendance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getClassAttendance = async (req, res) => {
    try {
        const { id: classId } = req.params;
        const liveClass = await LiveClass.findById(classId);
        if (!liveClass) return res.status(404).json({ success: false, message: "Live Class not found" });

        // Access checks
        if (req.user.role === "teacher" && liveClass.teacherId?.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: "Access denied." });
        }

        const attendance = await Attendance.find({ classId }).populate("studentId", "name email signInId");
        res.json({ success: true, message: "Class attendance retrieved successfully", data: attendance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAdminStats = async (req, res) => {
    try {
        const User = require("../models/user");
        
        // Group by studentId to get attendance percentage per student
        const studentStats = await Attendance.aggregate([
            {
                $group: {
                    _id: "$studentId",
                    total: { $sum: 1 },
                    present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } }
                }
            }
        ]);

        let totalPresent = 0;
        let totalRecords = 0;
        let atRiskCount = 0;
        let perfectCount = 0;

        const studentPercentages = [];

        studentStats.forEach(stat => {
            totalRecords += stat.total;
            totalPresent += stat.present;
            const percentage = stat.total > 0 ? (stat.present / stat.total) * 100 : 0;
            if (percentage < 75) atRiskCount++;
            if (percentage === 100) perfectCount++;
            studentPercentages.push({ studentId: stat._id, percentage, present: stat.present });
        });

        const avgAttendance = totalRecords > 0 ? (totalPresent / totalRecords) * 100 : 0;

        // Class-wise performance
        const classStats = await Attendance.aggregate([
            {
                $group: {
                    _id: "$classId",
                    total: { $sum: 1 },
                    present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } }
                }
            }
        ]);

        const populatedClassStats = await LiveClass.populate(classStats, { path: "_id", select: "topic date", populate: { path: "teacherId", select: "name" } });
        
        const classes = populatedClassStats.map(c => {
            if (!c._id) return null;
            const percentage = c.total > 0 ? (c.present / c.total) * 100 : 0;
            return {
                title: c._id.topic,
                instructor: c._id.teacherId ? c._id.teacherId.name : "Unknown",
                session: new Date(c._id.date).toLocaleDateString(),
                attendance: percentage.toFixed(1) + "%",
                status: percentage >= 90 ? "Excellent" : percentage >= 75 ? "Good" : "Warning"
            };
        }).filter(Boolean);

        // Top student
        studentPercentages.sort((a, b) => b.percentage - a.percentage || b.present - a.present);
        let topStudentData = null;
        if (studentPercentages.length > 0) {
            const topStudent = await User.findById(studentPercentages[0].studentId).select("name signInId");
            if (topStudent) {
                topStudentData = {
                    name: topStudent.name,
                    id: topStudent.signInId,
                    percentage: studentPercentages[0].percentage.toFixed(1) + "%"
                };
            }
        }

        res.json({
            success: true,
            data: {
                avgAttendance: avgAttendance.toFixed(1) + "%",
                atRiskCount,
                perfectCount,
                classes,
                topStudent: topStudentData
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};
