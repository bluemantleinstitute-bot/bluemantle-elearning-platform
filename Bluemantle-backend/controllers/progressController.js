const Progress = require("../models/Progress");
const Video = require("../models/video");
const Course = require("../models/Course");
const Module = require("../models/Module");
const Batch = require("../models/Batch");

exports.watchVideo = async (req, res) => {
    try {
        const { courseId, moduleId, videoId } = req.body;
        const userId = req.user.id;

        if (!courseId || !moduleId || !videoId) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        // Validate that video, course, module hierarchy is intact
        const video = await Video.findOne({ _id: videoId, courseId, moduleId });
        if (!video) {
            return res.status(400).json({ success: false, message: "Invalid video or mismatched course/module hierarchy" });
        }

        // Sequential Access Check: Check if previous video (by order) is watched
        if (video.order > 1) {
            const previousVideo = await Video.findOne({ moduleId, order: video.order - 1 });
            if (previousVideo) {
                const prevProgress = await Progress.findOne({ 
                    userId, 
                    courseId, 
                    moduleId, 
                    completedVideos: previousVideo._id 
                });
                if (!prevProgress) {
                    return res.status(403).json({ 
                        success: false, 
                        message: "Locked: Please watch the previous video first." 
                    });
                }
            }
        } else if (video.order === 1) {
            // If it's the first video of a module (order 1), check if the previous module's last video was watched
            const currentModule = await Module.findById(moduleId);
            if (currentModule && currentModule.order > 1) {
                const previousModule = await Module.findOne({ courseId, order: currentModule.order - 1 });
                if (previousModule) {
                    const lastVideoOfPrevModule = await Video.findOne({ moduleId: previousModule._id }).sort({ order: -1 });
                    if (lastVideoOfPrevModule) {
                        const prevModuleProgress = await Progress.findOne({
                            userId,
                            courseId,
                            moduleId: previousModule._id,
                            completedVideos: lastVideoOfPrevModule._id
                        });
                        if (!prevModuleProgress) {
                            return res.status(403).json({
                                success: false,
                                message: "Locked: Please complete the previous module first."
                            });
                        }
                    }
                }
            }
        }

        // Get total videos for the module
        const totalVideos = await Video.countDocuments({ moduleId });
        
        // Find or create progress record
        let progress = await Progress.findOne({ userId, courseId, moduleId });
        if (!progress) {
            progress = new Progress({ userId, courseId, moduleId, completedVideos: [] });
        }

        // Only add if not strictly present
        if (!progress.completedVideos.includes(videoId)) {
            progress.completedVideos.push(videoId);
        }

        // Recalculate percentage
        progress.completionPercentage = totalVideos > 0 ? (progress.completedVideos.length / totalVideos) * 100 : 100;
        if (progress.completionPercentage > 100) progress.completionPercentage = 100;
        const isCompleted = progress.completionPercentage >= 100;
        progress.status = isCompleted ? "completed" : "in_progress";
        if (isCompleted && !progress.completedAt) {
            progress.completedAt = new Date();
        }
        
        progress.lastAccessedVideo = videoId;
        await progress.save();

        // Calculate next unlocked video
        const nextVideo = await Video.findOne({ moduleId, order: video.order + 1 });
        let nextVideoId = null;
        if (nextVideo) {
            nextVideoId = nextVideo._id;
        } else {
            // Try next module's first video
            const currentModule = await Module.findById(moduleId);
            const nextModule = await Module.findOne({ courseId, order: currentModule.order + 1 });
            if (nextModule) {
                const firstVideoOfNextModule = await Video.findOne({ moduleId: nextModule._id, order: 1 });
                if (firstVideoOfNextModule) {
                    nextVideoId = firstVideoOfNextModule._id;
                }
            }
        }

        res.json({ 
            success: true, 
            message: "Progress updated successfully", 
            data: {
                progress,
                nextVideoId
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getCourseProgress = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.id;

        const modules = await Module.find({ courseId }).sort({ order: 1 });
        const totalVideosInCourse = await Video.countDocuments({ courseId });
        
        const moduleProgress = await Progress.find({ userId, courseId });
        
        let totalCompletedVideos = 0;
        moduleProgress.forEach(p => {
            totalCompletedVideos += p.completedVideos.length;
        });

        const coursePercentage = totalVideosInCourse > 0 ? (totalCompletedVideos / totalVideosInCourse) * 100 : 0;

        const detailedProgress = modules.map(m => {
            const prog = moduleProgress.find(p => p.moduleId.toString() === m._id.toString());
            return {
                moduleId: m._id,
                title: m.title,
                completedVideos: prog ? prog.completedVideos.length : 0,
                percentage: prog ? prog.completionPercentage : 0,
                status: prog ? prog.status : "locked",
                completedAt: prog ? prog.completedAt : null,
                resourcesUnlocked: !!(prog && prog.status === "completed")
            };
        });

        res.json({ 
            success: true, 
            message: "Course progress retrieved successfully", 
            data: {
                coursePercentage: Number(coursePercentage.toFixed(2)),
                detailedProgress
            } 
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getUserProgress = async (req, res) => {
    try {
        const targetUserId = req.params.userId;
        const requestor = req.user;

        if (requestor.role === "student" && targetUserId !== requestor.id) {
            return res.status(403).json({ success: false, message: "Access denied. You can only view your own progress." });
        }

        if (requestor.role === "teacher") {
            const assignedBatches = await Batch.find({ teacherId: requestor.id });
            const studentInTeacherBatch = assignedBatches.some(b => b.students.includes(targetUserId));
            if (!studentInTeacherBatch) {
                return res.status(403).json({ success: false, message: "Access denied. Student is not in any of your assigned batches." });
            }
        }

        const progress = await Progress.find({ userId: targetUserId })
            .populate("courseId", "title")
            .populate("moduleId", "title")
            .populate("lastAccessedVideo", "title");

        res.json({ success: true, message: "User progress retrieved successfully", data: progress });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
