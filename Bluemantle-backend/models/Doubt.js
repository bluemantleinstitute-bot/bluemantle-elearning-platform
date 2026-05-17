const mongoose = require("mongoose");

const doubtSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    question: {
      type: String,
      required: true
    },
    answer: {
      type: String,
      default: null
    },
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    status: {
      type: String,
      enum: ["Pending", "In Review", "Resolved"],
      default: "Pending"
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Low"
    },
    resolvedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Doubt", doubtSchema);
