const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    youtubeId: {
      type: String
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
    order: {
      type: Number,
      required: true
    },
    duration: {
      type: String,
      default: "0:00"
    },
    description: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

// Compound index for sorting videos inside modules correctly
videoSchema.index({ courseId: 1, moduleId: 1, order: 1 });

// Cascading Delete/Recalculation on Video Delete
videoSchema.pre("findOneAndDelete", async function () {
  const video = await this.model.findOne(this.getQuery());
  if (video) {
    // 1. We remove this video from all progress documents that have it
    const affectedProgresses = await mongoose.model("Progress").find({ completedVideos: video._id });
    
    // Find the new total number of videos in this module (minus the one being deleted)
    const newTotalVideos = (await mongoose.model("Video").countDocuments({ moduleId: video.moduleId })) - 1;
    
    for (const prog of affectedProgresses) {
        prog.completedVideos = prog.completedVideos.filter(vid => vid.toString() !== video._id.toString());
        if (newTotalVideos <= 0) {
            prog.completionPercentage = 0;
        } else {
            prog.completionPercentage = (prog.completedVideos.length / newTotalVideos) * 100;
        }
        if (prog.lastAccessedVideo && prog.lastAccessedVideo.toString() === video._id.toString()) {
            prog.lastAccessedVideo = null;
        }
        await prog.save();
    }

    // 2. REORDER: Shift all subsequent videos down by 1 to fill the gap
    await this.model.updateMany(
      { 
        moduleId: video.moduleId, 
        order: { $gt: video.order } 
      },
      { $inc: { order: -1 } }
    );
  }
});

module.exports = mongoose.model("Video", videoSchema);