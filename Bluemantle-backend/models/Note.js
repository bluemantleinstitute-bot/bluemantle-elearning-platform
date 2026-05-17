const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
      required: true
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      default: null,
      index: true
    },
    type: {
      type: String,
      enum: ["PDF", "Note", "Assignment", "Resource"],
      default: "Note",
      index: true
    },
    visibility: {
      type: String,
      enum: ["enrolled", "batch", "hidden"],
      default: "enrolled",
      index: true
    },
    unlockMode: {
      type: String,
      enum: ["auto", "manual"],
      default: "auto",
      index: true
    },
    manualUnlocked: {
      type: Boolean,
      default: false
    },
    unlockedForStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    description: {
      type: String,
      default: ""
    },
    fileSize: {
      type: String,
      default: "Unknown"
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    accessLog: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        },
        accessedAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  { timestamps: true }
);

noteSchema.index({ courseId: 1, moduleId: 1, batchId: 1, visibility: 1, isActive: 1 });

module.exports = mongoose.model("Note", noteSchema);
