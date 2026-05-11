const mongoose = require("mongoose");
const Note = require("../models/Note");
const User = require("../models/user");
const Batch = require("../models/Batch");
const Module = require("../models/Module");
const Progress = require("../models/Progress");

const RESOURCE_TYPES = ["PDF", "Note", "Assignment", "Resource"];
const VISIBILITY_TYPES = ["enrolled", "batch", "hidden"];
const UNLOCK_MODES = ["auto", "manual"];

const sameId = (left, right) => left && right && left.toString() === right.toString();
const isPrivilegedRole = (role) => ["admin", "owner"].includes((role || "").toLowerCase());
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const normalizeResourceType = (value) => {
    const match = RESOURCE_TYPES.find((type) => type.toLowerCase() === String(value || "").toLowerCase());
    return match || "Note";
};

const validateCourseModule = async (courseId, moduleId) => {
    if (!isValidId(courseId) || !isValidId(moduleId)) {
        throw new Error("Invalid course or module id");
    }

    const module = await Module.findOne({ _id: moduleId, courseId }).lean();
    if (!module) {
        throw new Error("Invalid module for selected course");
    }
    return module;
};

const getTeacherScope = async (teacherId) => {
    const batches = await Batch.find({ teacherId }).select("_id courseId students").lean();
    return {
        batchIds: batches.map((batch) => batch._id.toString()),
        courseIds: [...new Set(batches.map((batch) => batch.courseId?.toString()).filter(Boolean))]
    };
};

const assertManageAccess = async (user, resource = null, courseId = null, batchId = null) => {
    if (isPrivilegedRole(user.role)) return true;
    if ((user.role || "").toLowerCase() !== "teacher") return false;

    const scope = await getTeacherScope(user.id);
    const resourceCourseId = (resource?.courseId?._id || resource?.courseId || courseId)?.toString();
    const resourceBatchId = (resource?.batchId?._id || resource?.batchId || batchId)?.toString();

    if (resourceBatchId) return scope.batchIds.includes(resourceBatchId);
    return !!resourceCourseId && scope.courseIds.includes(resourceCourseId);
};

const getStudentBatchForCourse = async (user, courseId) => {
    const explicitBatchId = user.batchId?._id || user.batchId;
    if (explicitBatchId) {
        const batch = await Batch.findById(explicitBatchId).select("_id courseId students").lean();
        if (batch && sameId(batch.courseId, courseId)) return batch;
    }

    return Batch.findOne({ courseId, students: user._id }).select("_id courseId students").lean();
};

const getResourceAccess = async (resource, user) => {
    if (!resource?.isActive) {
        return { allowed: false, reason: "Resource is not active" };
    }

    if ((user.role || "").toLowerCase() !== "student") {
        return { allowed: true, reason: "" };
    }

    const enrolled = (user.enrolledCourses || []).some((courseId) => sameId(courseId, resource.courseId?._id || resource.courseId));
    if (!enrolled) {
        return { allowed: false, reason: "Course not assigned to this student" };
    }

    if (resource.visibility === "hidden") {
        return { allowed: false, reason: "Resource is hidden" };
    }

    const studentBatch = await getStudentBatchForCourse(user, resource.courseId?._id || resource.courseId);
    if (resource.visibility === "batch") {
        if (!resource.batchId || !studentBatch || !sameId(resource.batchId?._id || resource.batchId, studentBatch._id)) {
            return { allowed: false, reason: "Resource is restricted to another batch" };
        }
    } else if (resource.batchId && (!studentBatch || !sameId(resource.batchId?._id || resource.batchId, studentBatch._id))) {
        return { allowed: false, reason: "Resource is restricted to another batch" };
    }

    const moduleUnlockCondition = resource.moduleId?.unlockCondition || "auto";
    const requiresManualUnlock = resource.unlockMode === "manual" || moduleUnlockCondition === "manual";
    const hasManualAccess = resource.manualUnlocked || (resource.unlockedForStudents || []).some((studentId) => sameId(studentId, user._id));

    if (requiresManualUnlock) {
        return hasManualAccess
            ? { allowed: true, reason: "" }
            : { allowed: false, reason: "Waiting for teacher/admin unlock" };
    }

    const progress = await Progress.findOne({
        userId: user._id,
        courseId: resource.courseId?._id || resource.courseId,
        moduleId: resource.moduleId?._id || resource.moduleId
    }).select("status completionPercentage completedAt").lean();

    if (progress?.status === "completed" || progress?.completionPercentage >= 100) {
        return { allowed: true, reason: "" };
    }

    return { allowed: false, reason: "Complete this module to unlock resources" };
};

const studentResourcePayload = (resource, access) => ({
    id: resource._id,
    _id: resource._id,
    name: resource.title,
    title: resource.title,
    type: resource.type,
    folder: resource.courseId?.title || "Course Materials",
    module: resource.moduleId?.title || "Module",
    moduleId: resource.moduleId?._id || resource.moduleId,
    moduleOrder: resource.moduleId?.order || 0,
    size: resource.fileSize || "Unknown",
    visibility: resource.visibility,
    unlockMode: resource.unlockMode,
    isUnlocked: access.allowed,
    lockedReason: access.reason,
    accessUrl: access.allowed ? `/notes/${resource._id}/access` : null,
    createdAt: resource.createdAt
});

const managementPayload = (resource) => {
    const item = resource.toObject ? resource.toObject() : resource;
    return {
        ...item,
        accessCount: item.accessLog?.length || 0,
        recentAccess: (item.accessLog || []).slice(-5).reverse()
    };
};

exports.createNote = async (req, res) => {
    try {
        const {
            title,
            fileUrl,
            courseId,
            moduleId,
            batchId,
            type,
            visibility = "enrolled",
            unlockMode = "auto",
            manualUnlocked = false,
            description = "",
            fileSize = "Unknown"
        } = req.body;

        if (!title || !fileUrl || !courseId || !moduleId) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        if (!VISIBILITY_TYPES.includes(visibility) || !UNLOCK_MODES.includes(unlockMode)) {
            return res.status(400).json({ success: false, message: "Invalid visibility or unlock mode" });
        }

        await validateCourseModule(courseId, moduleId);

        let batch = null;
        if (batchId) {
            if (!isValidId(batchId)) {
                return res.status(400).json({ success: false, message: "Invalid batch id" });
            }
            batch = await Batch.findById(batchId).select("_id courseId").lean();
            if (!batch || !sameId(batch.courseId, courseId)) {
                return res.status(400).json({ success: false, message: "Batch does not belong to selected course" });
            }
        }

        if (visibility === "batch" && !batchId) {
            return res.status(400).json({ success: false, message: "Batch visibility requires a batch" });
        }

        if (!(await assertManageAccess(req.user, null, courseId, batchId))) {
            return res.status(403).json({ success: false, message: "You cannot upload resources for this course or batch" });
        }

        const note = await Note.create({
            title,
            fileUrl,
            courseId,
            moduleId,
            batchId: batchId || null,
            type: normalizeResourceType(type),
            visibility,
            unlockMode,
            manualUnlocked: !!manualUnlocked,
            description,
            fileSize,
            uploadedBy: req.user.id
        });

        res.status(201).json({ success: true, message: "Resource created successfully", data: note });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getStudentNotes = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("role enrolledCourses batchId").lean();

        if (!user || !user.enrolledCourses || user.enrolledCourses.length === 0) {
            return res.json({ success: true, folders: [], modules: [], recentFiles: [] });
        }

        const resources = await Note.find({
            courseId: { $in: user.enrolledCourses },
            isActive: true,
            visibility: { $ne: "hidden" }
        })
            .populate("courseId", "title")
            .populate("moduleId", "title order unlockCondition")
            .populate("batchId", "name")
            .sort({ createdAt: -1 })
            .lean();

        const enriched = await Promise.all(resources.map(async (resource) => {
            const access = await getResourceAccess(resource, user);
            return studentResourcePayload(resource, access);
        }));

        const foldersByCourse = {};
        const modulesByKey = {};

        enriched.forEach((resource) => {
            if (!foldersByCourse[resource.folder]) {
                foldersByCourse[resource.folder] = {
                    name: resource.folder,
                    fileCount: 0,
                    unlockedCount: 0,
                    lockedCount: 0
                };
            }
            foldersByCourse[resource.folder].fileCount += 1;
            foldersByCourse[resource.folder][resource.isUnlocked ? "unlockedCount" : "lockedCount"] += 1;

            const moduleKey = `${resource.folder}:${resource.moduleId}`;
            if (!modulesByKey[moduleKey]) {
                modulesByKey[moduleKey] = {
                    course: resource.folder,
                    module: resource.module,
                    moduleOrder: resource.moduleOrder,
                    resources: []
                };
            }
            modulesByKey[moduleKey].resources.push(resource);
        });

        const modules = Object.values(modulesByKey).sort((a, b) => {
            if (a.course !== b.course) return a.course.localeCompare(b.course);
            return a.moduleOrder - b.moduleOrder;
        });

        res.json({
            success: true,
            folders: Object.values(foldersByCourse),
            modules,
            recentFiles: enriched.slice(0, 10)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.accessResource = async (req, res) => {
    try {
        const resource = await Note.findOne({ _id: req.params.id, isActive: true })
            .populate("courseId", "title")
            .populate("moduleId", "title order unlockCondition")
            .populate("batchId", "name")
            .select("+fileUrl");

        if (!resource) {
            return res.status(404).json({ success: false, message: "Resource not found" });
        }

        const user = req.userDb || await User.findById(req.user.id).select("role enrolledCourses batchId");
        const manageAccess = await assertManageAccess(req.user, resource);
        const studentAccess = await getResourceAccess(resource, user);

        if (!manageAccess && !studentAccess.allowed) {
            return res.status(403).json({ success: false, message: studentAccess.reason || "Resource locked" });
        }

        if ((user.role || "").toLowerCase() === "student") {
            resource.accessLog.push({ studentId: user._id, accessedAt: new Date() });
            await resource.save();
        }

        res.json({ success: true, url: resource.fileUrl });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAllNotes = async (req, res) => {
    try {
        let query = {};
        if (!isPrivilegedRole(req.user.role)) {
            const scope = await getTeacherScope(req.user.id);
            query = {
                $or: [
                    { batchId: { $in: scope.batchIds } },
                    { batchId: null, courseId: { $in: scope.courseIds } },
                    { batchId: { $exists: false }, courseId: { $in: scope.courseIds } }
                ]
            };
        }

        const notes = await Note.find(query)
            .populate("courseId", "title")
            .populate("moduleId", "title order unlockCondition")
            .populate("batchId", "name")
            .populate("uploadedBy", "name email role")
            .sort({ createdAt: -1 });

        res.json({ success: true, data: notes.map(managementPayload) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateNote = async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);
        if (!note) {
            return res.status(404).json({ success: false, message: "Resource not found" });
        }

        if (!(await assertManageAccess(req.user, note))) {
            return res.status(403).json({ success: false, message: "You cannot update this resource" });
        }

        const {
            title,
            fileUrl,
            courseId,
            moduleId,
            batchId,
            type,
            visibility,
            unlockMode,
            manualUnlocked,
            description,
            fileSize,
            isActive
        } = req.body;

        const nextCourseId = courseId || note.courseId;
        const nextModuleId = moduleId || note.moduleId;
        if (courseId || moduleId) {
            await validateCourseModule(nextCourseId, nextModuleId);
        }

        if (visibility !== undefined && !VISIBILITY_TYPES.includes(visibility)) {
            return res.status(400).json({ success: false, message: "Invalid visibility" });
        }
        if (unlockMode !== undefined && !UNLOCK_MODES.includes(unlockMode)) {
            return res.status(400).json({ success: false, message: "Invalid unlock mode" });
        }

        let nextBatchId = batchId === undefined ? note.batchId : batchId || null;
        if (nextBatchId) {
            const batch = await Batch.findById(nextBatchId).select("_id courseId").lean();
            if (!batch || !sameId(batch.courseId, nextCourseId)) {
                return res.status(400).json({ success: false, message: "Batch does not belong to selected course" });
            }
        }

        if ((visibility || note.visibility) === "batch" && !nextBatchId) {
            return res.status(400).json({ success: false, message: "Batch visibility requires a batch" });
        }

        Object.assign(note, {
            ...(title !== undefined && { title }),
            ...(fileUrl !== undefined && { fileUrl }),
            ...(courseId !== undefined && { courseId }),
            ...(moduleId !== undefined && { moduleId }),
            ...(batchId !== undefined && { batchId: nextBatchId }),
            ...(type !== undefined && { type: normalizeResourceType(type) }),
            ...(visibility !== undefined && { visibility }),
            ...(unlockMode !== undefined && { unlockMode }),
            ...(manualUnlocked !== undefined && { manualUnlocked: !!manualUnlocked }),
            ...(description !== undefined && { description }),
            ...(fileSize !== undefined && { fileSize }),
            ...(isActive !== undefined && { isActive: !!isActive })
        });

        await note.save();
        res.json({ success: true, message: "Resource updated successfully", data: note });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.overrideResourceAccess = async (req, res) => {
    try {
        const { studentId, manualUnlocked } = req.body;
        const note = await Note.findById(req.params.id);
        if (!note) {
            return res.status(404).json({ success: false, message: "Resource not found" });
        }

        if (!(await assertManageAccess(req.user, note))) {
            return res.status(403).json({ success: false, message: "You cannot override this resource" });
        }

        if (manualUnlocked !== undefined) {
            note.manualUnlocked = !!manualUnlocked;
        }

        if (studentId) {
            if (!isValidId(studentId)) {
                return res.status(400).json({ success: false, message: "Invalid student id" });
            }
            const alreadyUnlocked = note.unlockedForStudents.some((id) => sameId(id, studentId));
            if (!alreadyUnlocked) {
                note.unlockedForStudents.push(studentId);
            }
        }

        await note.save();
        res.json({ success: true, message: "Resource unlock override saved", data: note });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteNote = async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);
        if (!note) {
            return res.status(404).json({ success: false, message: "Resource not found" });
        }

        if (!(await assertManageAccess(req.user, note))) {
            return res.status(403).json({ success: false, message: "You cannot delete this resource" });
        }

        await note.deleteOne();
        res.json({ success: true, message: "Resource deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
