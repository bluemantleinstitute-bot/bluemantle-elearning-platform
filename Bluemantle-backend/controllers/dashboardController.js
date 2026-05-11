const mongoose = require("mongoose");
const User = require("../models/user");
const Progress = require("../models/Progress");
const Batch = require("../models/Batch");
const LiveClass = require("../models/LiveClass");
const Notification = require("../models/Notification");
const Attendance = require("../models/Attendance");
const Announcement = require("../models/Announcement");
const MarketNews = require("../models/MarketNews");
const Video = require("../models/video");
const Course = require("../models/Course");

exports.getStudentDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const studentId = new mongoose.Types.ObjectId(userId);

    // 1. Execute parallel queries
    const [user, progressRecords, allBatches, notifications, attendanceStats, announcements, marketNews] = await Promise.all([
      User.findById(studentId)
        .select("name enrolledCourses level totalXP deviceId deviceStatus lastActive createdAt")
        .populate({
          path: "enrolledCourses",
          select: "title description price isPaid"
        })
        .lean(),

      Progress.find({ userId: studentId })
        .select("courseId completionPercentage")
        .lean(),

      Batch.find({ students: studentId })
        .select("_id name teacherId")
        .populate("teacherId", "name")
        .lean(),

      Notification.find({ userId: studentId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("title message type status isRead createdAt")
        .lean(),

      Attendance.aggregate([
        { $match: { studentId } },
        { 
          $group: {
            _id: null,
            totalClasses: { $sum: 1 },
            present: {
              $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] }
            }
          }
        }
      ]),
      
      Announcement.find().sort({ createdAt: -1 }).limit(10).lean(),
      
      MarketNews.find().sort({ createdAt: -1 }).limit(5).lean()
    ]);

    const batch = allBatches[0]; // For legacy single-batch references
    const batchIds = allBatches.map(b => b._id);

    // Filter announcements by targetBatch if necessary
    const filteredAnnouncements = announcements.filter(a => !a.targetBatch || batchIds.some(bid => bid.toString() === a.targetBatch.toString()));

    // 2. Fetch Upcoming Classes for all assigned batches
    const upcomingClasses = await LiveClass.find({
      batchId: { $in: batchIds },
      $or: [
        { status: "live" },
        { date: { $gte: new Date(Date.now() - 3600000) } } // Classes from last hour to future
      ]
    })
    .sort({ date: 1 })
    .limit(5)
    .populate("batchId", "name")
    .populate("teacherId", "name")
    .lean();

    // 2.5 Fetch Recent Recordings from enrolled courses (added within last 48 hours)
    const validEnrolledCourses = (user?.enrolledCourses || []).filter(c => c != null);
    const enrolledCourseIds = validEnrolledCourses.map(c => c._id);
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    
    const recentVideos = await Video.find({ 
      courseId: { $in: enrolledCourseIds },
      createdAt: { $gte: fortyEightHoursAgo }
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title duration createdAt")
      .lean();

    // 3. Transform Progress Data (Course-wise average completion percentage)
    const progressMap = {};
    
    // Initialize all enrolled courses with 0% first
    if (validEnrolledCourses.length > 0) {
      validEnrolledCourses.forEach(course => {
        progressMap[course._id.toString()] = "0.00";
      });
    }

    if (progressRecords && progressRecords.length > 0) {
      const courseProgressTracker = {};

      progressRecords.forEach((p) => {
        const cid = p.courseId.toString();
        if (!courseProgressTracker[cid]) {
          courseProgressTracker[cid] = { totalPercentage: 0, count: 0 };
        }
        courseProgressTracker[cid].totalPercentage += parseFloat(p.completionPercentage) || 0;
        courseProgressTracker[cid].count += 1;
      });

      for (const cid in courseProgressTracker) {
        progressMap[cid] = (courseProgressTracker[cid].totalPercentage / courseProgressTracker[cid].count).toFixed(2);
      }
    }

    // 4. Format Attendance Summary
    let attendanceSummary = { totalClasses: 0, present: 0, percentage: 0 };
    if (attendanceStats && attendanceStats.length > 0) {
      const stats = attendanceStats[0];
      const percentage = stats.totalClasses > 0 ? (stats.present / stats.totalClasses) * 100 : 0;
      attendanceSummary = {
        totalClasses: stats.totalClasses || 0,
        present: stats.present || 0,
        percentage: Number(percentage.toFixed(2))
      };
    }

    // 5. Build Final Aggregated Response safely avoiding nulls
    console.log("Emily debug: enrolledCourses =", user?.enrolledCourses);
    console.log("Emily debug: recentVideos =", recentVideos);

    return res.json({
      success: true,
      data: {
        profile: {
           id: userId,
           name: user?.name || "Student",
           level: user?.level || "Beginner",
           totalXP: user?.totalXP || 0,
           batch: batch?.name || "Unassigned",
           teacher: batch?.teacherId?.name || "None",
           joined: user?.createdAt
        },
        enrolledCourses: validEnrolledCourses,
        progress: progressMap,
        upcomingClasses: upcomingClasses || [],
        reminders: notifications || [],
        attendanceSummary,
        announcements: filteredAnnouncements || [],
        marketNews: marketNews || [],
        recordings: recentVideos || [],

        activeDevice: user?.deviceId ? {
          id: user.deviceId,
          status: user.deviceStatus,
          lastActive: user.lastActive
        } : null
      }
    });

  } catch (error) {
    console.error("Error in getStudentDashboard:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};

exports.getTeacherDashboard = async (req, res) => {
  try {
    const teacherId = req.user.id;
    if (!teacherId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const now = new Date();

    // Execute parallel queries for performance
    const [user, batches, todayClasses, upcomingClasses, teacherClasses] = await Promise.all([
      User.findById(teacherId).select("name role").lean(),
      Batch.find({ teacherId })
        .select("name courseId students maxStudents")
        .populate("courseId", "title")
        .lean(),
        
      LiveClass.find({
        teacherId,
        date: { $gte: todayStart, $lte: todayEnd }
      })
        .sort({ date: 1 })
        .select("topic date duration zoomLink batchId reminderSent status teacherId")
        .populate("batchId", "name")
        .lean(),
        
      LiveClass.find({
        teacherId,
        date: { $gte: now }
      })
        .sort({ date: 1 })
        .limit(5)
        .select("topic date duration zoomLink batchId reminderSent status teacherId")
        .populate("batchId", "name")
        .lean(),
        
      LiveClass.find({ teacherId })
        .select("_id")
        .lean()
    ]);

    // Calculate total student count
    const studentCount = batches.reduce((sum, b) => sum + (b.students ? b.students.length : 0), 0);

    // Calculate attendance summary
    const classIds = teacherClasses.map(c => c._id);
    let attendanceSummary = { 
      totalClassesHandled: teacherClasses.length, 
      totalAttendanceMarked: 0, 
      averageAttendancePercentage: 0 
    };

    if (classIds.length > 0) {
      const attendanceStats = await Attendance.aggregate([
        { $match: { classId: { $in: classIds } } },
        {
          $group: {
            _id: null,
            totalMarked: { $sum: 1 },
            present: {
              $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] }
            }
          }
        }
      ]);

      if (attendanceStats && attendanceStats.length > 0) {
        const stats = attendanceStats[0];
        attendanceSummary.totalAttendanceMarked = stats.totalMarked;
        const percentage = stats.totalMarked > 0 ? (stats.present / stats.totalMarked) * 100 : 0;
        attendanceSummary.averageAttendancePercentage = Number(percentage.toFixed(2));
      }
    }

    // Extract unique courses from assigned batches
    const courses = [];
    const courseIds = new Set();
    batches.forEach(b => {
      if (b.courseId && !courseIds.has(b.courseId._id.toString())) {
        courseIds.add(b.courseId._id.toString());
        courses.push({
          id: b.courseId._id,
          title: b.courseId.title
        });
      }
    });

    // Return structured response
    return res.json({
      success: true,
      data: {
        profile: {
          name: user?.name || "Teacher",
          role: user?.role || "Faculty"
        },
        assignedBatches: batches || [],
        assignedCourses: courses,
        studentCount: studentCount || 0,
        todayClasses: todayClasses || [],
        upcomingClasses: upcomingClasses || [],
        attendanceSummary
      }
    });

  } catch (error) {
    console.error("Error in getTeacherDashboard:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};
exports.getAdminDashboard = async (req, res) => {
  try {
    console.log("[ADMIN DASHBOARD] Fetching statistics...");
    
    const [totalStudents, totalCourses, teachers, liveClasses] = await Promise.all([
      User.countDocuments({ role: "student" }),
      Course.countDocuments({ isActive: true }),
      User.find({ role: "teacher" }).select("name email").limit(5).lean(),
      LiveClass.find({ date: { $gte: new Date() } })
        .sort({ date: 1 })
        .limit(5)
        .populate("teacherId", "name")
        .populate("batchId", "name")
        .lean()
    ]);

    console.log(`[ADMIN DASHBOARD] Data retrieved: Students=${totalStudents}, Courses=${totalCourses}, Live=${liveClasses.length}`);

    return res.json({
      success: true,
      data: {
        stats: {
          totalStudents,
          totalCourses,
          activeLiveClasses: liveClasses.length,
          engagementRate: "82%"
        },
        faculty: teachers.map(t => ({
          name: t.name,
          email: t.email,
          status: "Active"
        })),
        liveSessions: liveClasses.map(c => ({
          title: c.topic,
          details: `${c.batchId?.name || "Batch"} · ${c.teacherId?.name || "Teacher"}`,
          status: new Date(c.date) <= new Date() ? "Live" : "Scheduled"
        }))
      }
    });
  } catch (error) {
    console.error("[ADMIN DASHBOARD ERROR]:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server Error",
      error: error.message // Sending error message temporarily for debugging
    });
  }
};
