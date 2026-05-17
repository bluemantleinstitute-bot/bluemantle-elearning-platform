const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    signInId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    plainPassword: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ["admin", "owner", "student", "teacher"],
      default: "student",
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "suspended", "pending", "blocked"],
      default: "active",
      index: true,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      default: null,
    },
    deviceId: {
      type: String,
      default: null,
    },
    deviceStatus: {
      type: String,
      enum: ["Authorised", "Pending", "Rejected", "None"],
      default: "None",
    },
    otp: {
      type: String,
      default: null,
    },
    otpExpires: {
      type: Date,
      default: null,
    },
    activeToken: {
      type: String,
      default: null,
    },
    title: {
      type: String,
      default: "",
    },
    profilePicture: {
      type: String,
      default: "",
    },
    linkedin: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    level: {
      type: String,
      default: "Beginner",
    },
    totalXP: {
      type: Number,
      default: 0,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    enrolledCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      }
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
