const Batch = require("../models/Batch");
const Course = require("../models/Course");
const User = require("../models/user");

exports.createBatch = async (req, res) => {
    try {
        const { name, courseId, maxStudents, startDate, endDate } = req.body;
        if (!name || !courseId) return res.status(400).json({ success: false, message: "Missing required fields" });

        const batch = await Batch.create({ name, courseId, maxStudents: maxStudents || 100, startDate, endDate });
        res.status(201).json({ success: true, message: "Batch created successfully", data: batch });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.listBatches = async (req, res) => {
    try {
        const batches = await Batch.find().populate("courseId", "title").populate("teacherId", "name email signInId");
        res.json({ success: true, message: "Batches retrieved successfully", data: batches });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateBatch = async (req, res) => {
    try {
        const { name, maxStudents, startDate, endDate } = req.body;
        const batch = await Batch.findById(req.params.id);
        if (!batch) return res.status(404).json({ success: false, message: "Batch not found" });

        if (name) batch.name = name;
        if (maxStudents) batch.maxStudents = maxStudents;
        if (startDate) batch.startDate = startDate;
        if (endDate) batch.endDate = endDate;

        await batch.save();
        res.json({ success: true, message: "Batch updated successfully", data: batch });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getBatchDetails = async (req, res) => {
    try {
        const batch = await Batch.findById(req.params.id)
            .populate("courseId", "title")
            .populate("teacherId", "name email signInId")
            .populate("students", "name email signInId");
        
        if (!batch) return res.status(404).json({ success: false, message: "Batch not found" });

        // Access check logic: if student, must be in batch. If teacher, must be the assigned teacher. Admins pass.
        if (req.user.role === "student" && !batch.students.some(s => s._id.toString() === req.user.id)) {
            return res.status(403).json({ success: false, message: "Access denied. Not enrolled in this batch." });
        }
        
        if (req.user.role === "teacher") {
            const batchTeacherId = batch.teacherId?._id?.toString() || batch.teacherId?.toString();
            // Allow if assigned as batch teacher
            const isAssignedTeacher = batchTeacherId === req.user.id;
            
            // Also allow if they have ANY live class for this batch (secondary check)
            const LiveClass = require("../models/LiveClass");
            const hasClass = await LiveClass.exists({ batchId: batch._id, teacherId: req.user.id });

            if (!isAssignedTeacher && !hasClass) {
                return res.status(403).json({ success: false, message: "Access denied. Not assigned to this batch or its classes." });
            }
        }

        res.json({ success: true, message: "Batch details retrieved successfully", data: batch });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.assignTeacher = async (req, res) => {
    try {
        const { teacherId } = req.body;
        const teacher = await User.findById(teacherId);
        if (!teacher || teacher.role !== "teacher") {
            return res.status(400).json({ success: false, message: "Invalid teacher ID or user is not a teacher." });
        }

        const existingBatch = await Batch.findById(req.params.id);
        if (!existingBatch) return res.status(404).json({ success: false, message: "Batch not found" });

        existingBatch.teacherId = teacherId;
        await existingBatch.save();

        res.json({ success: true, message: "Teacher assigned successfully", data: existingBatch });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.removeTeacher = async (req, res) => {
    try {
        const batch = await Batch.findById(req.params.id);
        if (!batch) return res.status(404).json({ success: false, message: "Batch not found" });

        batch.teacherId = null;
        await batch.save();

        res.json({ success: true, message: "Teacher removed successfully", data: batch });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.addStudents = async (req, res) => {
    try {
        const { studentIds } = req.body; // Expecting array of ids
        if (!Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ success: false, message: "Please provide an array of studentIds" });
        }
        
        const batch = await Batch.findById(req.params.id);
        if (!batch) return res.status(404).json({ success: false, message: "Batch not found" });

        // Check if over limit
        if (batch.students.length + studentIds.length > batch.maxStudents) {
            return res.status(400).json({ success: false, message: "Adding these students exceeds the batch limit." });
        }

        // Check against duplicate courses
        const otherBatchesForCourse = await Batch.find({ courseId: batch.courseId, _id: { $ne: batch._id } });
        const studentsInOtherBatches = new Set();
        otherBatchesForCourse.forEach(b => {
             b.students.forEach(s => studentsInOtherBatches.add(s.toString()));
        });

        const newStudents = [];
        for (let sid of studentIds) {
             if (studentsInOtherBatches.has(sid.toString())) {
                 return res.status(400).json({ success: false, message: `Student ${sid} is already in another batch for this course.` });
             }
             if (!batch.students.includes(sid)) {
                 newStudents.push(sid);
             }
        }

        batch.students.push(...newStudents);
        await batch.save();

        // Update batchId on User model
        await User.updateMany({ _id: { $in: newStudents } }, { batchId: batch._id });

        res.json({ success: true, message: "Students added successfully", data: batch });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.removeStudent = async (req, res) => {
    try {
        const { studentId } = req.body;
        if (!studentId) return res.status(400).json({ success: false, message: "studentId is required" });

        const batch = await Batch.findById(req.params.id);
        if (!batch) return res.status(404).json({ success: false, message: "Batch not found" });

        batch.students = batch.students.filter(id => id.toString() !== studentId);
        await batch.save();

        // Update batchId on User model
        await User.findByIdAndUpdate(studentId, { batchId: null });

        res.json({ success: true, message: "Student removed successfully", data: batch });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
