require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/user");
const Course = require("./models/Course");
const Progress = require("./models/Progress");
const Video = require("./models/video");
const { hashPassword } = require("./utils/hashPassword");

async function setup() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const password = await hashPassword("password123");
        
        // 1. Create/Update Emily
        const emily = await User.findOneAndUpdate(
            { signInId: "emily_student" },
            { 
                name: "Emily Watson", 
                email: "emily@bluemantle.com", 
                password: password, 
                role: "student", 
                status: "active" 
            },
            { upsert: true, new: true }
        );
        console.log("✅ User 'Emily' ready (emily_student)");

        // 2. Get a Course to enroll her in
        const course = await Course.findOne({ isActive: true });
        if (!course) {
            console.error("No active courses found. Run rebuild_system.js first.");
            process.exit(1);
        }

        if (!emily.enrolledCourses.includes(course._id)) {
            emily.enrolledCourses.push(course._id);
            await emily.save();
            console.log(`✅ Emily enrolled in: ${course.title}`);
        }

        // 3. Create Progress for Emily
        // We'll simulate that she completed some chapters
        const progress = await Progress.findOneAndUpdate(
            { userId: emily._id, courseId: course._id },
            { 
                completionPercentage: 65,
                lastAccessed: new Date(),
                completedChapters: [] // We don't need exact IDs for the dashboard bar
            },
            { upsert: true, new: true }
        );
        console.log("✅ Emily progress set to 65%");

        // 4. Ensure there are recent videos in this course
        const videos = await Video.find({ courseId: course._id }).sort({ createdAt: -1 }).limit(3);
        if (videos.length > 0) {
            console.log(`✅ Course has ${videos.length} videos available for 'Recently Added' section.`);
        }

        await mongoose.disconnect();
        console.log("\n🚀 WALKTHROUGH DATA READY for Emily.");
    } catch (error) {
        console.error("Setup error:", error);
    }
}

setup();
