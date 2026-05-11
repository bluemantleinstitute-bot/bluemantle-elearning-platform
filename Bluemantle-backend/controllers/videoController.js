const Video = require("../models/video");
const Progress = require("../models/Progress");
const Module = require("../models/Module");

exports.addVideo = async (req, res) => {
    try {
        const { title, youtubeId, courseId, moduleId, order, duration, description } = req.body;

        if (!title || !courseId || !moduleId || order === undefined) {
            return res.status(400).json({ success: false, message: "Missing required fields: title, courseId, moduleId, and order are required." });
        }

        const video = await Video.create({
            title,
            youtubeId,
            courseId,
            moduleId,
            order,
            duration,
            description
        });

        res.status(201).json({
            success: true,
            message: "Video added successfully",
            data: video
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getAllVideos = async (req, res) => {
    try {
        const videos = await Video.find()
            .populate("courseId", "title")
            .populate("moduleId", "title")
            .sort({ createdAt: -1 });
        res.json({ success: true, message: "Videos retrieved successfully", data: videos });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getVideo = async (req, res) => {
    try {
        const videoId = req.params.id;
        const userId = req.user.id;

        const video = await Video.findById(videoId);
        if (!video) {
            return res.status(404).json({ success: false, message: "Video not found" });
        }

        // Access Check: Sequential Lock
        if (req.user.role === "student") {
            if (video.order > 1) {
                const previousVideo = await Video.findOne({ moduleId: video.moduleId, order: video.order - 1 });
                if (previousVideo) {
                    const prevProgress = await Progress.findOne({ 
                        userId, 
                        moduleId: video.moduleId, 
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
                const currentModule = await Module.findById(video.moduleId);
                if (currentModule && currentModule.order > 1) {
                    const previousModule = await Module.findOne({ courseId: video.courseId, order: currentModule.order - 1 });
                    if (previousModule) {
                        const lastVideoOfPrevModule = await Video.findOne({ moduleId: previousModule._id }).sort({ order: -1 });
                        if (lastVideoOfPrevModule) {
                            const prevModuleProgress = await Progress.findOne({
                                userId,
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
        }

        res.json({ success: true, data: video });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateVideo = async (req, res) => {
    try {
        const video = await Video.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!video) {
            return res.status(404).json({ success: false, message: "Video not found" });
        }
        res.json({ success: true, message: "Video updated successfully", data: video });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteVideo = async (req, res) => {
    try {
        const video = await Video.findOneAndDelete({ _id: req.params.id });
        if (!video) {
            return res.status(404).json({ success: false, message: "Video not found" });
        }
        res.json({ success: true, message: "Video deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};