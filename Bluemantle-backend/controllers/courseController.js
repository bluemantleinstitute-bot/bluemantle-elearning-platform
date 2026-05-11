const Course = require("../models/Course");
const Module = require("../models/Module");
const Video = require("../models/video");
const Note = require("../models/Note");
const User = require("../models/user");
const Batch = require("../models/Batch");
const Progress = require("../models/Progress");

const sameId = (left, right) => left && right && left.toString() === right.toString();

const getStudentBatchForCourse = async (user, courseId) => {
    const explicitBatchId = user.batchId?._id || user.batchId;
    if (explicitBatchId) {
        const batch = await Batch.findById(explicitBatchId).select("_id courseId students").lean();
        if (batch && sameId(batch.courseId, courseId)) return batch;
    }

    return Batch.findOne({ courseId, students: user._id }).select("_id courseId students").lean();
};

const sanitizeStudentNotes = async (notes, modules, user, courseId) => {
    const studentBatch = await getStudentBatchForCourse(user, courseId);
    const progressRecords = await Progress.find({ userId: user._id, courseId })
        .select("moduleId status completionPercentage")
        .lean();
    const progressByModule = new Map(progressRecords.map((progress) => [progress.moduleId.toString(), progress]));
    const moduleById = new Map(modules.map((module) => [module._id.toString(), module]));

    return notes
        .filter((note) => {
            if (!note.isActive || note.visibility === "hidden") return false;
            if (note.visibility === "batch" || note.batchId) {
                return !!studentBatch && sameId(note.batchId, studentBatch._id);
            }
            return true;
        })
        .map((note) => {
            const module = moduleById.get(note.moduleId.toString());
            const progress = progressByModule.get(note.moduleId.toString());
            const requiresManualUnlock = note.unlockMode === "manual" || module?.unlockCondition === "manual";
            const hasManualAccess = note.manualUnlocked || (note.unlockedForStudents || []).some((studentId) => sameId(studentId, user._id));
            const isUnlocked = requiresManualUnlock
                ? hasManualAccess
                : progress?.status === "completed" || progress?.completionPercentage >= 100;

            const { fileUrl, accessLog, unlockedForStudents, ...safeNote } = note;
            return {
                ...safeNote,
                isUnlocked: !!isUnlocked,
                lockedReason: isUnlocked ? "" : requiresManualUnlock ? "Waiting for teacher/admin unlock" : "Complete this module to unlock resources",
                accessUrl: isUnlocked ? `/api/notes/${note._id}/access` : null
            };
        });
};

exports.createCourse = async (req, res) => {
    try {
        const { title, description, price, isPaid, duration } = req.body;
        if (!title) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const course = await Course.create({
            title,
            description,
            price,
            isPaid,
            duration,
            createdBy: req.user.id
        });

        res.status(201).json({ success: true, message: "Course created successfully", data: course });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getCourses = async (req, res) => {
    try {
        const User = require("../models/user");
        const includeInactive = req.query.includeInactive === "true";
        const filter = includeInactive ? {} : { isActive: true };
        const courses = await Course.find(filter).lean();
        
        const coursesWithStats = await Promise.all(courses.map(async (course) => {
            const moduleCount = await Module.countDocuments({ courseId: course._id });
            const enrolledStudents = await User.countDocuments({ enrolledCourses: course._id });
            return {
                ...course,
                moduleCount,
                enrolledStudents
            };
        }));

        res.json({ success: true, message: "Courses retrieved successfully", data: coursesWithStats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


exports.getCourseDetails = async (req, res) => {
    try {
        const { id } = req.params;
        
        const course = await Course.findOne({ _id: id, isActive: true }).lean();
        if (!course) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }

        const modules = await Module.find({ courseId: id }).sort({ order: 1 }).lean();
        const videos = await Video.find({ courseId: id }).sort({ order: 1 }).lean();
        let notes = await Note.find({ courseId: id }).lean();
        if ((req.user.role || "").toLowerCase() === "student") {
            const user = req.userDb || await User.findById(req.user.id).select("role enrolledCourses batchId").lean();
            notes = await sanitizeStudentNotes(notes, modules, user, id);
        }

        const formattedModules = modules.map(mod => {
            return {
                ...mod,
                videos: videos.filter(v => v.moduleId.toString() === mod._id.toString()),
                notes: notes.filter(n => n.moduleId.toString() === mod._id.toString())
            };
        });

        res.json({
            success: true,
            message: "Course details retrieved successfully",
            data: {
                course,
                modules: formattedModules
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getCourseVideos = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await Course.findOne({ _id: id, isActive: true });
        if (!course) return res.status(404).json({ success: false, message: "Course not found" });

        const videos = await Video.find({ courseId: id }).sort({ moduleId: 1, order: 1 });
        res.json({ success: true, message: "Videos retrieved successfully", data: videos });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getCourseNotes = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await Course.findOne({ _id: id, isActive: true });
        if (!course) return res.status(404).json({ success: false, message: "Course not found" });

        let notes = await Note.find({ courseId: id }).lean();
        if ((req.user.role || "").toLowerCase() === "student") {
            const modules = await Module.find({ courseId: id }).lean();
            const user = req.userDb || await User.findById(req.user.id).select("role enrolledCourses batchId").lean();
            notes = await sanitizeStudentNotes(notes, modules, user, id);
        }
        res.json({ success: true, message: "Notes retrieved successfully", data: notes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await Course.findById(id);
        if (!course) return res.status(404).json({ success: false, message: "Course not found" });

        const { title, description, price, duration, isPaid } = req.body;

        if (title !== undefined) course.title = title;
        if (description !== undefined) course.description = description;
        if (duration !== undefined) course.duration = duration;
        
        // Only take isPaid from request if we don't have price logic overriding it
        if (isPaid !== undefined) course.isPaid = isPaid;

        if (price !== undefined) {
            if (typeof price !== 'number' || price < 0) {
                return res.status(400).json({ success: false, message: "Price must be a positive number" });
            }
            course.price = price;
            if (price > 0) course.isPaid = true;
            if (price === 0) course.isPaid = false;
        }

        await course.save();
        res.json({ success: true, message: "Course updated successfully", data: course });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await Course.findById(id);
        if (!course) return res.status(404).json({ success: false, message: "Course not found" });
        if (!course.isActive) return res.status(400).json({ success: false, message: "Course is already inactive" });

        course.isActive = false;
        await course.save();

        res.json({ success: true, message: "Course deleted successfully", data: course });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.restoreCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await Course.findById(id);
        if (!course) return res.status(404).json({ success: false, message: "Course not found" });
        if (course.isActive) return res.status(400).json({ success: false, message: "Course is already active" });

        course.isActive = true;
        await course.save();

        res.json({ success: true, message: "Course restored successfully", data: course });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
