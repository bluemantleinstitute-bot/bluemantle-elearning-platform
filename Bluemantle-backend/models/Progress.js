const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
      required: true,
      index: true
    },
    completedVideos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video"
      }
    ],
    completionPercentage: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ["locked", "in_progress", "completed"],
      default: "in_progress",
      index: true
    },
    completedAt: {
      type: Date
    },
    lastAccessedVideo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video"
    }
  },
  { timestamps: true }
);

// Compound index targeting fast upserts per user per module
progressSchema.index({ userId: 1, courseId: 1, moduleId: 1 }, { unique: true });

module.exports = mongoose.model("Progress", progressSchema);
