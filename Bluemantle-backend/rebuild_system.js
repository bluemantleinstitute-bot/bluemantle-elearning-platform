require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/user");
const Course = require("./models/Course");
const Module = require("./models/Module");
const Video = require("./models/video");
const Batch = require("./models/Batch");
const Note = require("./models/Note");
const { hashPassword } = require("./utils/hashPassword");

async function rebuild() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB cluster.");

        // 1. ADMIN
        const adminId = "admin_master";
        const adminPassword = "BlueMantleAdmin2026!";
        const hashedAdminPassword = await hashPassword(adminPassword);
        await User.findOneAndUpdate(
            { signInId: adminId },
            { name: "Master Admin", signInId: adminId, email: "admin@bluemantle.com", password: hashedAdminPassword, role: "admin", status: "active" },
            { upsert: true, new: true }
        );
        console.log(`✅ ADMIN: ${adminId}`);

        // 2. TEACHER & STUDENT FOR WALKTHROUGH
        const testPassword = await hashPassword("password123");
        const teacher = await User.findOneAndUpdate(
            { signInId: "TEA-110942" },
            { name: "Prof. Adrian Vance", email: "vance@bluemantle.com", password: testPassword, role: "teacher", status: "active" },
            { upsert: true, new: true }
        );
        console.log(`✅ TEACHER: TEA-110942`);

        const student = await User.findOneAndUpdate(
            { signInId: "student123" },
            { name: "Julian Chen", email: "julian@test.com", password: testPassword, role: "student", status: "active" },
            { upsert: true, new: true }
        );
        console.log(`✅ STUDENT: student123`);

        // 3. COURSES & CONTENT
        const courses = await Course.find();
        const validVideoIds = ["y6120QOlsfU", "aircAruvnKk", "h9E3_Uu8Lq0", "L2m3O7Xp2M0"];

        for (const course of courses) {
            let module = await Module.findOne({ courseId: course._id });
            if (!module) {
                module = await Module.create({ title: "Foundations & Strategy", courseId: course._id, order: 1 });
            }

            // Sync 3 Videos per course with valid YouTube IDs
            const existingVideos = await Video.find({ moduleId: module._id });
            if (existingVideos.length < 3) {
                await Video.create([
                    { title: "Market Microstructure 101", youtubeId: validVideoIds[0], courseId: course._id, moduleId: module._id, order: 1, duration: "12:45" },
                    { title: "Advanced Technical Analysis", youtubeId: validVideoIds[1], courseId: course._id, moduleId: module._id, order: 2, duration: "18:20" },
                    { title: "Risk Management Frameworks", youtubeId: validVideoIds[2], courseId: course._id, moduleId: module._id, order: 3, duration: "15:10" }
                ]);
                console.log(`[+] Added 3 Playable Videos to: ${course.title}`);
            }

            // Sync 3 Notes
            const noteCount = await Note.countDocuments({ courseId: course._id });
            if (noteCount === 0) {
                await Note.create([
                    { title: "Course Syllabus", fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", courseId: course._id, moduleId: module._id },
                    { title: "Institutional Reading List", fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", courseId: course._id, moduleId: module._id },
                    { title: "Term 1 Slides", fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", courseId: course._id, moduleId: module._id }
                ]);
                console.log(`[+] Added 3 Notes to: ${course.title}`);
            }
        }

        // 4. BATCH ASSIGNMENT
        let batch = await Batch.findOne({ name: "Quant-Alpha-2026" });
        if (!batch) {
            batch = await Batch.create({ 
                name: "Quant-Alpha-2026", 
                courseId: courses[0]._id, 
                teacherId: teacher._id, 
                maxStudents: 50,
                students: [student._id]
            });
            console.log("✅ BATCH: Created Quant-Alpha-2026 and linked Teacher/Student");
        } else {
            batch.teacherId = teacher._id;
            if (!batch.students.includes(student._id)) batch.students.push(student._id);
            await batch.save();
            console.log("✅ BATCH: Updated Quant-Alpha-2026 assignments");
        }

        console.log("\n🚀 SYSTEM REBUILD SUCCESSFUL: Walkthrough ready.");
        await mongoose.disconnect();
    } catch (error) {
        console.error("Error during rebuild:", error);
    }
}

rebuild();
