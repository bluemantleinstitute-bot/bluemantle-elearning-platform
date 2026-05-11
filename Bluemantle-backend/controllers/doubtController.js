const Doubt = require("../models/Doubt");

// Student submits a new doubt
exports.submitDoubt = async (req, res) => {
    try {
        const { subject, question, instructorId, priority } = req.body;
        if (!subject || !question) {
            return res.status(400).json({ success: false, message: "Subject and Question are required" });
        }

        const doubt = await Doubt.create({
            studentId: req.user.id,
            subject,
            question,
            instructorId: instructorId || null,
            priority: priority || "Low"
        });

        res.status(201).json({ success: true, message: "Doubt submitted successfully", data: doubt });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Student gets their own doubts
exports.getMyDoubts = async (req, res) => {
    try {
        const doubts = await Doubt.find({ studentId: req.user.id })
            .sort({ createdAt: -1 })
            .lean();
        res.json({ success: true, data: doubts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Admin/Teacher gets all doubts
exports.getAllDoubts = async (req, res) => {
    try {
        const { status, limit, instructorId } = req.query;
        const query = {};
        
        if (status) query.status = { $regex: status, $options: 'i' };
        
        // If teacher, only show doubts assigned to them or unassigned
        if (req.user.role === "teacher") {
            query.$or = [
                { instructorId: req.user.id },
                { instructorId: null }
            ];
        } else if (instructorId) {
            query.instructorId = instructorId;
        }

        const doubts = await Doubt.find(query)
            .populate("studentId", "name email")
            .populate("instructorId", "name email")
            .sort({ createdAt: -1 })
            .limit(parseInt(limit) || 50)
            .lean();
            
        res.json({ success: true, data: doubts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Teacher/Admin responds to a doubt
exports.respondToDoubt = async (req, res) => {
    try {
        const { id } = req.params;
        const { answer, status } = req.body;

        if (!answer) {
            return res.status(400).json({ success: false, message: "Answer is required" });
        }

        const doubt = await Doubt.findById(id);
        if (!doubt) {
            return res.status(404).json({ success: false, message: "Doubt not found" });
        }

        doubt.answer = answer;
        doubt.status = status || "Resolved";
        doubt.instructorId = req.user.id;
        doubt.resolvedAt = Date.now();
        
        await doubt.save();

        res.json({ success: true, message: "Response submitted successfully", data: doubt });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Admin QA Stats
exports.getDoubtStats = async (req, res) => {
    try {
        const stats = await Doubt.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    resolved: { $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] } },
                    pending: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
                    inReview: { $sum: { $cond: [{ $eq: ["$status", "In Review"] }, 1, 0] } }
                }
            }
        ]);

        const instructorStats = await Doubt.aggregate([
            {
                $group: {
                    _id: "$instructorId",
                    count: { $sum: 1 },
                    resolved: { $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] } }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "instructor"
                }
            },
            { $unwind: { path: "$instructor", preserveNullAndEmptyArrays: true } }
        ]);

        res.json({
            success: true,
            data: {
                overview: stats[0] || { total: 0, resolved: 0, pending: 0, inReview: 0 },
                byInstructor: instructorStats
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
