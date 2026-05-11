require("dotenv").config();
const mongoose = require("mongoose");
const Course = require("./models/Course");
const Video = require("./models/video");
const User = require("./models/User");
const Batch = require("./models/Batch");

async function inspect() {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/bluemantle");
    const courses = await Course.find();
    const videos = await Video.find();
    const users = await User.find();
    const batches = await Batch.find();
    
    console.log("--- COURSES ---");
    courses.forEach(c => console.log(c.title));
    
    console.log("\n--- VIDEOS ---");
    videos.forEach(v => console.log(v.title));

    console.log("\n--- USERS ---");
    users.forEach(u => {
        console.log(`${u.name} (${u.role}) | ID: ${u.signInId} | Enrolled: ${u.enrolledCourses?.length || 0}`);
    });

    console.log("\n--- BATCHES ---");
    batches.forEach(b => console.log(`${b.name} | Students: ${b.students?.length || 0}`));
    
    await mongoose.disconnect();
}

inspect();
