require("dotenv").config();

const dns = require("dns");
const mongoose = require("mongoose");

dns.setServers((process.env.DNS_SERVERS || "1.1.1.1,8.8.8.8").split(",").map((server) => server.trim()));

const User = require("./models/user");
const Batch = require("./models/Batch");
const Course = require("./models/Course");
const LiveClass = require("./models/LiveClass");
const Attendance = require("./models/Attendance");

const shouldFix = process.argv.includes("--fix");

const id = (value) => value?.toString();
const hasId = (items, value) => items.has(id(value));

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  const [users, batches, courses, classes, attendance] = await Promise.all([
    User.find({}).select("name signInId role batchId enrolledCourses").lean(),
    Batch.find({}).select("name teacherId students courseId").lean(),
    Course.find({}).select("title isActive").lean(),
    LiveClass.find({}).select("topic teacherId batchId date status zoomMeetingId zoomLink recordingUrl zoomCloudRecordingUrl recordingExpiryDate").lean(),
    Attendance.find({}).select("classId studentId status").lean(),
  ]);

  const userIds = new Set(users.map((user) => id(user._id)));
  const batchIds = new Set(batches.map((batch) => id(batch._id)));
  const courseIds = new Set(courses.map((course) => id(course._id)));
  const classIds = new Set(classes.map((liveClass) => id(liveClass._id)));
  const usersById = new Map(users.map((user) => [id(user._id), user]));
  const batchesById = new Map(batches.map((batch) => [id(batch._id), batch]));

  const issues = [];
  const fixes = [];

  for (const batch of batches) {
    if (!batch.teacherId) issues.push(["batch-missing-teacher", batch.name, id(batch._id)]);
    else if (!hasId(userIds, batch.teacherId)) issues.push(["batch-teacher-not-found", batch.name, id(batch.teacherId)]);

    if (!batch.courseId) issues.push(["batch-missing-course", batch.name, id(batch._id)]);
    else if (!hasId(courseIds, batch.courseId)) issues.push(["batch-course-not-found", batch.name, id(batch.courseId)]);

    for (const studentId of batch.students || []) {
      if (!hasId(userIds, studentId)) issues.push(["batch-student-not-found", batch.name, id(studentId)]);
    }
  }

  for (const user of users.filter((item) => item.role === "student")) {
    if (user.batchId && !hasId(batchIds, user.batchId)) {
      issues.push(["student-batchId-not-found", user.name, id(user.batchId)]);
    }

    const containingBatches = batches.filter((batch) => (batch.students || []).some((studentId) => id(studentId) === id(user._id)));
    if (user.batchId && !containingBatches.some((batch) => id(batch._id) === id(user.batchId))) {
      issues.push(["student-batchId-not-in-batch-students", user.name, id(user.batchId)]);
      if (shouldFix && batchIds.has(id(user.batchId))) {
        await Batch.updateOne({ _id: user.batchId }, { $addToSet: { students: user._id } });
        fixes.push(["added-student-to-profile-batch", user.name, id(user.batchId)]);
      }
    }

    for (const courseId of user.enrolledCourses || []) {
      if (!hasId(courseIds, courseId)) issues.push(["student-course-not-found", user.name, id(courseId)]);
    }
  }

  for (const liveClass of classes) {
    const batch = batchesById.get(id(liveClass.batchId));
    const teacher = usersById.get(id(liveClass.teacherId));

    if (!hasId(batchIds, liveClass.batchId)) issues.push(["class-batch-not-found", liveClass.topic, id(liveClass.batchId)]);
    if (!hasId(userIds, liveClass.teacherId)) issues.push(["class-teacher-not-found", liveClass.topic, id(liveClass.teacherId)]);

    if (teacher && teacher.role !== "teacher") {
      issues.push(["class-teacher-is-not-teacher-role", liveClass.topic, teacher.name, teacher.role]);
    }

    if (batch?.teacherId && id(batch.teacherId) !== id(liveClass.teacherId)) {
      issues.push(["class-teacher-mismatch-batch-teacher", liveClass.topic, `classTeacher=${id(liveClass.teacherId)}`, `batchTeacher=${id(batch.teacherId)}`]);
      if (shouldFix) {
        await LiveClass.updateOne({ _id: liveClass._id }, { teacherId: batch.teacherId });
        fixes.push(["updated-class-teacher-to-batch-teacher", liveClass.topic, id(batch.teacherId)]);
      }
    }

    if (!liveClass.zoomMeetingId || !liveClass.zoomLink) {
      issues.push(["class-missing-zoom-data", liveClass.topic, id(liveClass._id)]);
    }
  }

  for (const record of attendance) {
    if (!hasId(classIds, record.classId)) issues.push(["attendance-class-not-found", id(record._id), id(record.classId)]);
    if (!hasId(userIds, record.studentId)) issues.push(["attendance-student-not-found", id(record._id), id(record.studentId)]);
  }

  console.log(JSON.stringify({
    mode: shouldFix ? "fix" : "audit",
    counts: {
      users: users.length,
      batches: batches.length,
      courses: courses.length,
      classes: classes.length,
      attendance: attendance.length,
    },
    issues,
    fixes,
  }, null, 2));

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
