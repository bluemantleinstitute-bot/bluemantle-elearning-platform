const mongoose = require("mongoose");

const moduleSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true
    },
    order: {
      type: Number,
      required: true
    },
    unlockCondition: {
      type: String,
      enum: ["auto", "manual"],
      default: "auto"
    }
  },
  { timestamps: true }
);

// Compound index for efficient sorting per course
moduleSchema.index({ courseId: 1, order: 1 });

// Cascading delete and reordering on Module Delete
moduleSchema.pre("findOneAndDelete", async function () {
  const mod = await this.model.findOne(this.getQuery());
  if (mod) {
    // 1. Delete all associated content
    await mongoose.model("Video").deleteMany({ moduleId: mod._id });
    await mongoose.model("Note").deleteMany({ moduleId: mod._id });

    // 2. REORDER: Shift all subsequent modules down by 1
    await this.model.updateMany(
      { 
        courseId: mod.courseId, 
        order: { $gt: mod.order } 
      },
      { $inc: { order: -1 } }
    );
  }
});

module.exports = mongoose.model("Module", moduleSchema);
