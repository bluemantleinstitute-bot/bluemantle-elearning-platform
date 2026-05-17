const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      index: true
    },
    description: {
      type: String
    },
    price: {
      type: Number
    },
    isPaid: {
      type: Boolean,
      default: false
    },
    duration: {
      type: String
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

// Cascading delete: Remove all modules, videos, and notes when a course is deleted
courseSchema.pre("findOneAndDelete", async function (next) {
  const courseId = this.getQuery()._id;
  
  if (courseId) {
    await mongoose.model("Module").deleteMany({ courseId });
    await mongoose.model("Video").deleteMany({ courseId });
    await mongoose.model("Note").deleteMany({ courseId });
  }
  next();
});

module.exports = mongoose.model("Course", courseSchema);
