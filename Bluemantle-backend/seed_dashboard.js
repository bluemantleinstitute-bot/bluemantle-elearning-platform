require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/user");
const Course = require("./models/Course");
const Module = require("./models/Module");
const Video = require("./models/video");
const Batch = require("./models/Batch");
const Announcement = require("./models/Announcement");
const MarketNews = require("./models/MarketNews");
const Attendance = require("./models/Attendance");
const Notification = require("./models/Notification");
const LiveClass = require("./models/LiveClass");
const { hashPassword } = require("./utils/hashPassword");

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/bluemantle");
  console.log("Connected to MongoDB");

  // 1. Create/Update Student
  const hashedPassword = await hashPassword("password123");
  let student = await User.findOne({ signInId: "student123" });
  if (!student) {
    student = await User.create({
      name: "John Doe",
      signInId: "student123",
      email: "student@test.com",
      password: hashedPassword,
      role: "student",
      status: "active",
      level: "Intermediate",
      totalXP: 1250,
      deviceId: "797DFCF883CD3FB8300271CAE27EA3F",
      deviceStatus: "authorised",
      lastActive: new Date()
    });
    console.log("Student user created.");
  }

  // 2. Create Course, Modules, and Videos
  let course = await Course.findOne({ title: "Mastering Quantitative Finance" });
  if (!course) {
    course = await Course.create({
      title: "Mastering Quantitative Finance",
      description: "A comprehensive guide to modern quantitative finance techniques and market analysis.",
      price: 499,
      isPaid: true,
      isActive: true
    });
    console.log("Course created.");
  }

  const moduleTitles = ["Introduction to Quants", "Probability & Statistics", "Derivatives Pricing"];
  let modules = [];
  for (let i = 0; i < moduleTitles.length; i++) {
    let mod = await Module.findOne({ title: moduleTitles[i], courseId: course._id });
    if (!mod) {
      mod = await Module.create({
        title: moduleTitles[i],
        courseId: course._id,
        order: i + 1
      });
    }
    modules.push(mod);
  }
  console.log("Modules created.");

  const videoData = [
    { title: "Market Microstructure 101", duration: "12:45", youtubeId: "dQw4w9WgXcQ", order: 1, moduleId: modules[0]._id },
    { title: "Black-Scholes Model Explained", duration: "25:30", youtubeId: "dQw4w9WgXcQ", order: 1, moduleId: modules[2]._id },
    { title: "Stochastic Calculus for Finance", duration: "18:15", youtubeId: "dQw4w9WgXcQ", order: 2, moduleId: modules[2]._id }
  ];

  for (const v of videoData) {
    await Video.findOneAndUpdate(
      { title: v.title, moduleId: v.moduleId },
      { ...v, courseId: course._id },
      { upsert: true }
    );
  }
  console.log("Videos created.");

  // Enroll student in course
  if (!student.enrolledCourses.includes(course._id)) {
    student.enrolledCourses.push(course._id);
    await student.save();
    console.log("Student enrolled in course.");
  }

  // 3. Create Batch
  let batch = await Batch.findOne({ name: "Quant-Alpha-2026" });
  if (!batch) {
    batch = await Batch.create({
      name: "Quant-Alpha-2026",
      courseId: course._id,
      students: [student._id],
      teacherId: student._id, // Self-assigned as teacher for demo purposes if needed
      maxStudents: 50
    });
    console.log("Batch created.");
  } else if (!batch.students.includes(student._id)) {
    batch.students.push(student._id);
    await batch.save();
  }

  // 4. Create Announcements
  const announcements = [
    { title: "Mid-Term Assessment", message: "The mid-term quiz will be held on next Friday at 4 PM. Please prepare Modules 1 and 2." },
    { title: "New Resource Added", message: "A new PDF guide on 'Advanced Option Greeks' has been uploaded to the resources section." },
    { title: "Guest Lecture: Dr. Smith", message: "Join us this Saturday for an exclusive guest lecture on Algorithmic Trading.", targetBatch: batch._id }
  ];
  for (const a of announcements) {
    await Announcement.findOneAndUpdate({ title: a.title }, a, { upsert: true });
  }
  console.log("Announcements created.");

  // 5. Create Market News
  const news = [
    { title: "Fed Maintains Interest Rates", content: "The Federal Reserve announced today that it will maintain current interest rates, citing stable inflation data.", category: "Economy", isTrending: true },
    { title: "Tech Stocks Surge on AI Earnings", content: "NVIDIA and Microsoft saw significant gains today after reporting record-breaking quarterly earnings driven by AI demand.", category: "Technology", isTrending: true },
    { title: "Oil Prices Dip on Global Supply Increase", content: "WTI crude fell below $75 per barrel as supply concerns eased following OPEC's latest production report.", category: "Commodities", isTrending: false }
  ];
  for (const n of news) {
    await MarketNews.findOneAndUpdate({ title: n.title }, n, { upsert: true });
  }
  console.log("Market News created.");

  // 6. Create Attendance Records
  const attendanceCount = await Attendance.countDocuments({ studentId: student._id });
  if (attendanceCount < 3) {
    const pastClasses = [];
    for (let i = 1; i <= 3; i++) {
      let pc = await LiveClass.create({
        topic: `Past Session ${i}`,
        date: new Date(Date.now() - (i * 86400000)), // Days ago
        duration: 60,
        zoomLink: "https://zoom.us/past",
        batchId: batch._id,
        teacherId: student._id
      });
      pastClasses.push(pc);
    }

    for (const pc of pastClasses) {
      await Attendance.create({
        studentId: student._id,
        classId: pc._id,
        status: "present"
      });
    }
    console.log("Attendance records created.");
  }

  // 7. Create Notifications (Reminders)
  const notifications = [
    { userId: student._id, title: "Review Module 2", message: "You haven't finished the videos in Probability & Statistics yet.", type: "warning", status: "unread" },
    { userId: student._id, title: "Live Class in 1 Hour", message: "Don't miss the 'Derivatives Pricing' live session today.", type: "info", status: "unread" }
  ];
  for (const n of notifications) {
    await Notification.findOneAndUpdate({ title: n.title, userId: student._id }, n, { upsert: true });
  }
  console.log("Notifications created.");

  // 8. Create Live Class
  let liveClass = await LiveClass.findOne({ batchId: batch._id });
  if (!liveClass) {
    liveClass = await LiveClass.create({
      topic: "Derivatives Deep Dive",
      date: new Date(Date.now() + 3600000), // In 1 hour
      duration: 90,
      zoomLink: "https://zoom.us/test",
      batchId: batch._id,
      teacherId: student._id,
      status: "live"
    });
    console.log("Live Class created.");
  } else {
    liveClass.status = "live";
    await liveClass.save();
    console.log("Live Class status updated to live.");
  }

  console.log("Seeding complete!");
  await mongoose.disconnect();
}

seed().catch(console.error);
