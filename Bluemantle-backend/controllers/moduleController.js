const Module = require("../models/Module");
const Video = require("../models/video");

exports.createModule = async (req, res) => {
    try {
        const { courseId, title, order, unlockCondition } = req.body;
        
        if (!courseId || !title || order === undefined) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const newModule = await Module.create({
            courseId,
            title,
            order,
            ...(unlockCondition !== undefined && { unlockCondition })
        });

        res.status(201).json({ success: true, message: "Module created successfully", data: newModule });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getCourseModules = async (req, res) => {
    try {
        const { courseId } = req.params;
        const modules = await Module.find({ courseId }).sort({ order: 1 });
        
        res.json({ success: true, message: "Modules retrieved successfully", data: modules });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateModule = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, order, unlockCondition } = req.body;

        const module = await Module.findByIdAndUpdate(
            id,
            {
                ...(title !== undefined && { title }),
                ...(order !== undefined && { order }),
                ...(unlockCondition !== undefined && { unlockCondition })
            },
            { new: true }
        );

        if (!module) return res.status(404).json({ success: false, message: "Module not found" });

        res.json({ success: true, message: "Module updated successfully", data: module });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteModule = async (req, res) => {
    try {
        const { id } = req.params;
        const module = await Module.findByIdAndDelete(id);
        if (!module) return res.status(404).json({ success: false, message: "Module not found" });

        // Cascade delete all videos in this module
        await Video.deleteMany({ moduleId: id });

        res.json({ success: true, message: "Module and its videos deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
