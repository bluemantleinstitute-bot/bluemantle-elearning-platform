require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/user");
const Course = require("./models/Course");
const Progress = require("./models/Progress");
const Video = require("./models/video");

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const emily = await User.findOne({ signInId: "emily_student" });
    if (!emily) {
        console.log("Emily not found!");
        return;
    }
    
    console.log(`User: ${emily.name} | Role: ${emily.role} | Enrolled: ${emily.enrolledCourses.length}`);
    
    const progress = await Progress.find({ userId: emily._id });
    console.log(`Progress records: ${progress.length}`);
    progress.forEach(p => console.log(` - Course ${p.courseId}: ${p.completionPercentage}%`));
    
    const enrolledCourses = await Course.find({ _id: { $in: emily.enrolledCourses } });
    enrolledCourses.forEach(async (c) => {
        const videos = await Video.find({ courseId: c._id });
        console.log(`Course: ${c.title} | Active: ${c.isActive} | Videos: ${videos.length}`);
    });
    
    setTimeout(() => mongoose.disconnect(), 2000);
}

check();
