const mongoose = require("mongoose");

const liveClassSchema = new mongoose.Schema(
  {
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
      index: true
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    zoomLink: {
      type: String,
      required: true
    },
    zoomMeetingId: {
      type: String
    },
    zoomStartUrl: {
      type: String  // Host/teacher start URL from Zoom
    },
    zoomHostId: {
      type: String
    },
    zoomHostEmail: {
      type: String,
      lowercase: true,
      trim: true
    },
    zoomPassword: {
      type: String  // Meeting password for joining
    },
    topic: {
      type: String
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    duration: {
      type: Number
    },
    reminderSent: {
      type: Boolean,
      default: false
    },
    recordingUrl: {
      type: String,
      default: null
    },
    zoomCloudRecordingUrl: {
      type: String,
      default: null
    },
    recordingExpiryDate: {
      type: Date,
      default: null,
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true
    },
    createdByRole: {
      type: String,
      enum: ["admin", "owner", "teacher"],
    },
    status: {
      type: String,
      enum: ["scheduled", "live", "finished", "recorded"],
      default: "scheduled"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("LiveClass", liveClassSchema);
