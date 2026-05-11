const LiveClass = require("../models/LiveClass");
const Batch = require("../models/Batch");
const Attendance = require("../models/Attendance");
const User = require("../models/user");
const zoomHelper = require("../utils/zoomHelper");

const RECORDING_ACCESS_DAYS = 7;

const isPrivilegedRole = (role) => ["admin", "owner"].includes(role);

const classBelongsToTeacher = async (liveClass, teacherId) => {
    if (liveClass.teacherId?.toString() === teacherId) return true;

    const batch = await Batch.findById(liveClass.batchId).select("teacherId").lean();
    return batch?.teacherId?.toString() === teacherId;
};

const getRecordingExpiryDate = (liveClass) => {
    if (liveClass.recordingExpiryDate) return new Date(liveClass.recordingExpiryDate);
    return new Date(new Date(liveClass.date).getTime() + RECORDING_ACCESS_DAYS * 24 * 60 * 60 * 1000);
};

const isSameObjectId = (left, right) => left?.toString() === right?.toString();

const validateStudentClassAccess = async (liveClass, userId, userDb) => {
    if (!liveClass) {
        return { ok: false, status: 404, message: "Class not found" };
    }

    const [batch, user] = await Promise.all([
        Batch.findById(liveClass.batchId).select("students courseId").lean(),
        userDb || User.findById(userId).select("batchId enrolledCourses role").lean()
    ]);

    if (!batch) {
        return { ok: false, status: 404, message: "Batch not found" };
    }

    if (!user || user.role !== "student") {
        return { ok: false, status: 403, message: "Only students can join or watch this class." };
    }

    const assignedByBatchList = (batch.students || []).some((studentId) => isSameObjectId(studentId, userId));
    const assignedByProfile = isSameObjectId(user.batchId, batch._id);
    if (!assignedByBatchList && !assignedByProfile) {
        return { ok: false, status: 403, message: "Access denied. Student is not assigned to this batch." };
    }

    const hasCourseAccess = (user.enrolledCourses || []).some((courseId) => isSameObjectId(courseId, batch.courseId));
    if (!hasCourseAccess) {
        return { ok: false, status: 403, message: "Access denied. Course access is required for this live class." };
    }

    return { ok: true, batch, user };
};

exports.scheduleClass = async (req, res) => {
    try {
        const { batchId, teacherId, topic, date, duration } = req.body;

        if (!batchId || !date) {
            return res.status(400).json({ success: false, message: "batchId and date are required" });
        }

        const batch = await Batch.findById(batchId).populate("teacherId", "name email");
        if (!batch) return res.status(404).json({ success: false, message: "Batch not found" });

        const batchTeacherId = batch.teacherId?._id || batch.teacherId;
        let resolvedTeacherId = teacherId || batchTeacherId;
        if (req.user.role === "teacher") {
            if (batchTeacherId?.toString() !== req.user.id) {
                return res.status(403).json({ success: false, message: "You can only schedule classes for batches assigned to you." });
            }
            resolvedTeacherId = req.user.id;
        }

        if (!resolvedTeacherId) {
            return res.status(400).json({ success: false, message: "Selected batch has no assigned teacher." });
        }

        const assignedTeacher = await User.findById(resolvedTeacherId).select("name email role");
        if (!assignedTeacher || assignedTeacher.role !== "teacher") {
            return res.status(400).json({ success: false, message: "Assigned faculty must be a valid teacher account." });
        }

        const proposedStart = new Date(date);
        if (Number.isNaN(proposedStart.getTime())) {
            return res.status(400).json({ success: false, message: "A valid date and time are required." });
        }

        if (proposedStart < new Date()) {
            return res.status(400).json({ success: false, message: "Live classes must be scheduled for a future time." });
        }

        const proposedDuration = parseInt(duration, 10) || 60;
        const proposedEnd = new Date(proposedStart.getTime() + proposedDuration * 60000);

        // Check: no overlapping sessions for the same faculty or batch.
        const existingActiveClasses = await LiveClass.find({
            status: { $in: ["scheduled", "live"] },
            $or: [
                { teacherId: resolvedTeacherId },
                { batchId }
            ]
        });

        const overlap = existingActiveClasses.find(c => {
            const existingStart = new Date(c.date);
            const existingDuration = parseInt(c.duration, 10) || 60;
            const existingEnd = new Date(existingStart.getTime() + existingDuration * 60000);
            return existingStart < proposedEnd && existingEnd > proposedStart;
        });

        if (overlap) {
            return res.status(409).json({
                success: false,
                message: "This teacher or batch already has a live class scheduled during this time slot."
            });
        }

        // Auto-create Zoom meeting
        let zoomData = {};
        try {
            zoomData = await zoomHelper.createZoomMeeting({
                topic: topic || `${batch.name} – Live Class`,
                startTime: new Date(date).toISOString(),
                duration: duration || 60,
                teacherEmail: assignedTeacher.email
            });
        } catch (zoomErr) {
            return res.status(502).json({
                success: false,
                message: `Zoom API error: ${zoomErr.message}`
            });
        }

        const liveClass = await LiveClass.create({
            batchId,
            teacherId: resolvedTeacherId,
            zoomLink: zoomData.joinUrl,
            zoomStartUrl: zoomData.startUrl,
            zoomMeetingId: zoomData.meetingId,
            zoomHostId: zoomData.hostId,
            zoomHostEmail: zoomData.hostEmail,
            zoomPassword: zoomData.password,
            topic: topic || `${batch.name} – Live Class`,
            date,
            duration: duration || 60,
            createdBy: req.user.id,
            createdByRole: req.user.role
        });

        const populated = await LiveClass.findById(liveClass._id)
            .populate("batchId", "name")
            .populate("teacherId", "name email");

        res.status(201).json({
            success: true,
            message: "Live class scheduled and Zoom meeting created successfully",
            data: populated
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAllClasses = async (req, res) => {
    try {
        const classes = await LiveClass.find({})
            .sort({ date: -1 })
            .populate("batchId", "name")
            .populate("teacherId", "name email");
        res.json({ success: true, message: "All live classes retrieved", data: classes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getClassById = async (req, res) => {
    try {
        const { id } = req.params;
        const liveClass = await LiveClass.findById(id)
            .populate("batchId", "name")
            .populate("teacherId", "name email");
        if (!liveClass) return res.status(404).json({ success: false, message: "Class not found" });
        res.json({ success: true, data: liveClass });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getTeacherClasses = async (req, res) => {
    try {
        const assignedBatches = await Batch.find({ teacherId: req.user.id }).select("_id").lean();
        const assignedBatchIds = assignedBatches.map((batch) => batch._id);

        const classes = await LiveClass.find({
            $or: [
                { teacherId: req.user.id },
                { batchId: { $in: assignedBatchIds } }
            ]
        })
            .sort({ date: 1 })
            .populate("batchId", "name courseId")
            .populate("teacherId", "name email");
        res.json({ success: true, message: "Classes retrieved successfully", data: classes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getBatchClasses = async (req, res) => {
    try {
        const { batchId } = req.params;
        const batch = await Batch.findById(batchId);
        if (!batch) return res.status(404).json({ success: false, message: "Batch not found" });

        if (req.user.role === "student" && !batch.students.includes(req.user.id)) {
            return res.status(403).json({ success: false, message: "Access denied. Not in batch." });
        }

        const classes = await LiveClass.find({ batchId }).sort({ date: 1 }).populate("teacherId", "name");
        res.json({ success: true, message: "Batch classes retrieved successfully", data: classes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getMyClasses = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Safety check for ObjectId
        const mongoose = require("mongoose");
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: "Invalid User ID" });
        }

        const studentId = new mongoose.Types.ObjectId(userId);
        
        // Student may be in multiple batches — find all
        const batchQuery = req.userDb?.batchId
            ? { $or: [{ students: studentId }, { _id: req.userDb.batchId }] }
            : { students: studentId };

        const user = await User.findById(userId).select("enrolledCourses").lean();
        const enrolledCourseIds = (user?.enrolledCourses || []).map((courseId) => courseId.toString());

        const batches = await Batch.find(batchQuery).select("_id courseId").lean();
        const accessibleBatches = batches.filter((batch) => enrolledCourseIds.includes(batch.courseId?.toString()));
        
        if (!accessibleBatches || accessibleBatches.length === 0) {
            // Return empty array but success: true
            return res.json({ success: true, message: "No batches assigned", data: [] });
        }

        const batchIds = accessibleBatches.map(b => b._id);
        const now = new Date();
        const classes = await LiveClass.find({ batchId: { $in: batchIds } })
            .sort({ date: 1 })
            .populate("teacherId", "name email")
            .populate("batchId", "name")
            .lean();

        const visibleClasses = classes
            .filter((liveClass) => {
                if (liveClass.status !== "recorded") return true;
                const expiry = getRecordingExpiryDate(liveClass);
                return expiry >= now;
            })
            .map((liveClass) => ({
                _id: liveClass._id,
                batchId: liveClass.batchId,
                teacherId: liveClass.teacherId,
                topic: liveClass.topic,
                date: liveClass.date,
                duration: liveClass.duration,
                status: liveClass.status,
                recordingExpiryDate: getRecordingExpiryDate(liveClass),
                recordingUrl: liveClass.recordingUrl || liveClass.zoomCloudRecordingUrl,
                createdAt: liveClass.createdAt,
                updatedAt: liveClass.updatedAt
            }));

        res.json({ success: true, message: "Your classes retrieved successfully", data: visibleClasses });
    } catch (error) {
        console.error("Error in getMyClasses:", error);
        res.status(500).json({ success: false, message: "Server error retrieving classes" });
    }
};

exports.joinLive = async (req, res) => {
    try {
        const { classId } = req.body;
        const userId = req.user.id;

        const liveClass = await LiveClass.findById(classId);
        if (!liveClass) return res.status(404).json({ success: false, message: "Class not found" });

        const access = await validateStudentClassAccess(liveClass, userId, req.userDb);
        if (!access.ok) {
            return res.status(access.status).json({ success: false, message: access.message });
        }

        if (liveClass.status !== "live") {
            return res.status(400).json({ success: false, message: "Class is not currently live" });
        }

        await Attendance.findOneAndUpdate(
            { classId, studentId: userId },
            { status: "present" },
            { upsert: true, new: true }
        );

        res.json({
            success: true,
            message: "Attendance marked as present",
            joinUrl: liveClass.zoomLink,
            meetingNumber: liveClass.zoomMeetingId,
            password: liveClass.zoomPassword,
            topic: liveClass.topic,
            duration: liveClass.duration
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.watchRecording = async (req, res) => {
    try {
        const { classId } = req.body;
        const userId = req.user.id;

        const liveClass = await LiveClass.findById(classId);
        if (!liveClass) return res.status(404).json({ success: false, message: "Class not found" });

        const access = await validateStudentClassAccess(liveClass, userId, req.userDb);
        if (!access.ok) {
            return res.status(access.status).json({ success: false, message: access.message });
        }

        const recordingUrl = liveClass.recordingUrl || liveClass.zoomCloudRecordingUrl;
        if (liveClass.status !== "recorded" || !recordingUrl) {
            return res.status(400).json({ success: false, message: "Recording not available yet" });
        }

        const expiryDate = getRecordingExpiryDate(liveClass);
        if (expiryDate < new Date()) {
            await Attendance.findOneAndUpdate(
                { classId, studentId: userId },
                { $setOnInsert: { status: "absent" } },
                { upsert: true, new: true }
            );

            return res.status(403).json({
                success: false,
                message: "Recording access expired. Attendance remains absent."
            });
        }

        const existingAttendance = await Attendance.findOne({ classId, studentId: userId });
        if (existingAttendance && existingAttendance.status === "present") {
            return res.json({ success: true, message: "Attendance already marked as present" });
        }

        await Attendance.findOneAndUpdate(
            { classId, studentId: userId },
            { status: "late" },
            { upsert: true, new: true }
        );

        res.json({ success: true, message: "Attendance marked as late", status: "late" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { classId } = req.params;
        const { status, recordingUrl, zoomCloudRecordingUrl } = req.body;

        const liveClass = await LiveClass.findById(classId);
        if (!liveClass) return res.status(404).json({ success: false, message: "Class not found" });

        if (!["teacher", "admin", "owner"].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: "Only faculty or admins can update class status." });
        }

        if (!isPrivilegedRole(req.user.role) && !(await classBelongsToTeacher(liveClass, req.user.id))) {
            return res.status(403).json({ success: false, message: "You can only update sessions assigned to you." });
        }

        if (status) liveClass.status = status;
        if (recordingUrl) {
            liveClass.recordingUrl = recordingUrl;
            liveClass.recordingExpiryDate = getRecordingExpiryDate(liveClass);
        }
        if (zoomCloudRecordingUrl) {
            liveClass.zoomCloudRecordingUrl = zoomCloudRecordingUrl;
            liveClass.recordingExpiryDate = getRecordingExpiryDate(liveClass);
        }

        await liveClass.save();

        res.json({ success: true, message: "Class status updated successfully", data: liveClass });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const attachCloudRecording = async (liveClass) => {
    if (!liveClass.zoomMeetingId) return null;

    const recordings = await zoomHelper.getMeetingRecordings(liveClass.zoomMeetingId);
    const playableRecording = recordings.find((file) => file.file_type === "MP4") || recordings[0];
    const recordingUrl = playableRecording?.play_url || playableRecording?.download_url;

    if (!recordingUrl) return null;

    liveClass.zoomCloudRecordingUrl = recordingUrl;
    liveClass.recordingExpiryDate = getRecordingExpiryDate(liveClass);
    liveClass.status = "recorded";
    await liveClass.save();

    return {
        recordingUrl,
        recordingExpiryDate: liveClass.recordingExpiryDate
    };
};

exports.getRecordings = async (req, res) => {
    try {
        const { classId } = req.params;
        const liveClass = await LiveClass.findById(classId);
        if (!liveClass || !liveClass.zoomMeetingId) {
            return res.status(404).json({ success: false, message: "Class or Zoom meeting ID not found" });
        }

        const recordings = await zoomHelper.getMeetingRecordings(liveClass.zoomMeetingId);
        res.json({ success: true, data: recordings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.syncCloudRecording = async (req, res) => {
    try {
        const { id } = req.params;
        const liveClass = await LiveClass.findById(id);

        if (!liveClass) return res.status(404).json({ success: false, message: "Class not found" });
        if (!isPrivilegedRole(req.user.role) && !(await classBelongsToTeacher(liveClass, req.user.id))) {
            return res.status(403).json({ success: false, message: "You can only sync recordings for sessions assigned to you." });
        }

        const recording = await attachCloudRecording(liveClass);
        if (!recording) {
            return res.status(404).json({
                success: false,
                message: "Zoom cloud recording is not available yet. Try again after Zoom finishes processing."
            });
        }

        res.json({ success: true, message: "Zoom cloud recording attached.", data: liveClass });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.syncZoomAttendance = async (req, res) => {
    try {
        const { classId } = req.body;
        const liveClass = await LiveClass.findById(classId).populate("batchId");
        if (!liveClass) return res.status(404).json({ success: false, message: "Class not found" });

        if (!liveClass.zoomMeetingId) {
            return res.status(400).json({ success: false, message: "No zoomMeetingId attached to this class." });
        }

        const participants = await zoomHelper.getMeetingParticipants(liveClass.zoomMeetingId);

        const durationByEmail = {};
        participants.forEach(p => {
            const email = p.user_email?.toLowerCase();
            if (email) {
                durationByEmail[email] = (durationByEmail[email] || 0) + p.duration;
            }
        });

        // 90% attendance threshold (class duration is in minutes, Zoom reports in seconds)
        const classDurationSeconds = (liveClass.duration || 60) * 60;
        const requiredSeconds = classDurationSeconds * 0.9;

        const batch = await Batch.findById(liveClass.batchId._id || liveClass.batchId).populate("students", "email");
        if (!batch) return res.status(404).json({ success: false, message: "Batch not found" });

        const ops = batch.students.map(student => {
            const studentEmail = student.email?.toLowerCase();
            const timeInMeeting = durationByEmail[studentEmail] || 0;
            const status = timeInMeeting >= requiredSeconds ? "present" : "absent";

            return {
                updateOne: {
                    filter: { classId: liveClass._id, studentId: student._id },
                    update: { $set: { status } },
                    upsert: true
                }
            };
        });

        if (ops.length > 0) {
            await Attendance.bulkWrite(ops);
        }

        res.json({ success: true, message: `Zoom attendance synced for ${ops.length} students` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateClass = async (req, res) => {
    try {
        const { id } = req.params;
        const { topic, date, duration } = req.body;

        const liveClass = await LiveClass.findById(id);
        if (!liveClass) return res.status(404).json({ success: false, message: "Class not found" });

        if (!isPrivilegedRole(req.user.role) && !(await classBelongsToTeacher(liveClass, req.user.id))) {
            return res.status(403).json({ success: false, message: "You can only update sessions assigned to you." });
        }

        // Overlap check if date or duration is changing
        if (date || duration) {
            const proposedStart = new Date(date || liveClass.date);
            const proposedDuration = parseInt(duration || liveClass.duration, 10) || 60;
            const proposedEnd = new Date(proposedStart.getTime() + proposedDuration * 60000);

            const existingActiveClasses = await LiveClass.find({
                _id: { $ne: id },
                status: { $in: ["scheduled", "live"] },
                $or: [
                    { teacherId: liveClass.teacherId },
                    { batchId: liveClass.batchId }
                ]
            });

            const overlap = existingActiveClasses.find(c => {
                const existingStart = new Date(c.date);
                const existingDuration = parseInt(c.duration, 10) || 60;
                const existingEnd = new Date(existingStart.getTime() + existingDuration * 60000);
                return existingStart < proposedEnd && existingEnd > proposedStart;
            });

            if (overlap) {
                return res.status(409).json({
                    success: false,
                    message: "This teacher or batch already has a live class scheduled during this time slot."
                });
            }
        }

        // Update Zoom meeting if date or topic changed
        if (topic || date || duration) {
            try {
                await zoomHelper.updateZoomMeeting(liveClass.zoomMeetingId, {
                    topic: topic || liveClass.topic,
                    startTime: date ? new Date(date).toISOString() : liveClass.date.toISOString(),
                    duration: duration || liveClass.duration
                });
            } catch (zoomErr) {
                console.error("Zoom update error:", zoomErr);
            }
        }

        if (topic) liveClass.topic = topic;
        if (date) liveClass.date = date;
        if (duration) liveClass.duration = duration;

        await liveClass.save();

        const populated = await LiveClass.findById(liveClass._id)
            .populate("batchId", "name")
            .populate("teacherId", "name email");

        res.json({ success: true, message: "Live class updated successfully", data: populated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteClass = async (req, res) => {
    try {
        const { id } = req.params;
        const liveClass = await LiveClass.findById(id);
        if (!liveClass) return res.status(404).json({ success: false, message: "Class not found" });

        if (!isPrivilegedRole(req.user.role) && !(await classBelongsToTeacher(liveClass, req.user.id))) {
            return res.status(403).json({ success: false, message: "You can only delete sessions assigned to you." });
        }

        // Delete Zoom meeting
        try {
            await zoomHelper.deleteZoomMeeting(liveClass.zoomMeetingId);
        } catch (zoomErr) {
            console.error("Zoom delete error:", zoomErr);
        }

        await LiveClass.findByIdAndDelete(id);
        // Also delete related attendance
        await Attendance.deleteMany({ classId: id });

        res.json({ success: true, message: "Live class deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.finishLiveClass = async (req, res) => {
    try {
        const { id } = req.params;
        const liveClass = await LiveClass.findById(id);
        
        if (!liveClass) return res.status(404).json({ success: false, message: "Class not found" });
        if (!isPrivilegedRole(req.user.role) && !(await classBelongsToTeacher(liveClass, req.user.id))) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        liveClass.status = "finished";
        await liveClass.save();

        const recording = await attachCloudRecording(liveClass);

        res.json({
            success: true,
            message: recording
                ? "Class finished and Zoom cloud recording attached."
                : "Class finished successfully. Zoom cloud recording is not available yet.",
            data: {
                recordingAvailable: Boolean(recording),
                recording
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.reigniteLiveClass = async (req, res) => {
    try {
        const { id } = req.params;
        const liveClass = await LiveClass.findById(id);
        
        if (!liveClass) return res.status(404).json({ success: false, message: "Class not found" });
        if (!isPrivilegedRole(req.user.role) && !(await classBelongsToTeacher(liveClass, req.user.id))) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        liveClass.status = "live";
        await liveClass.save();

        res.json({ success: true, message: "Class re-ignited successfully. Students can now re-enter the room." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
