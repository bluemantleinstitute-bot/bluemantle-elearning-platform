const mongoose = require("mongoose");
const LiveClass = require("./LiveClass");
const Attendance = require("./Attendance");

const batchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }
    ],
    maxStudents: {
      type: Number,
      default: 100
    },
    isLive: {
      type: Boolean,
      default: false
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    }
  },
  { timestamps: true }
);

// Cascading delete: Remove all related LiveClasses and Attendance when a batch is deleted
batchSchema.pre("findOneAndDelete", async function (next) {
  const batchId = this.getQuery()._id;
  
  if (batchId) {
    const classes = await mongoose.model("LiveClass").find({ batchId });
    const classIds = classes.map(c => c._id);
    
    await mongoose.model("Attendance").deleteMany({ classId: { $in: classIds } });
    await mongoose.model("LiveClass").deleteMany({ batchId });
  }
  next();
});

module.exports = mongoose.model("Batch", batchSchema);
