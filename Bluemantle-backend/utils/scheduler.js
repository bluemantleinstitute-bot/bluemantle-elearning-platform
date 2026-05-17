const cron = require("node-cron");
const LiveClass = require("../models/LiveClass");
const Batch = require("../models/Batch");
const User = require("../models/user");
const Notification = require("../models/Notification");
const Attendance = require("../models/Attendance");
const zoomHelper = require("./zoomHelper");

const RECORDING_ACCESS_DAYS = 7;

const getRecordingExpiryDate = (liveClass) => {
  if (liveClass.recordingExpiryDate) return new Date(liveClass.recordingExpiryDate);
  return new Date(new Date(liveClass.date).getTime() + RECORDING_ACCESS_DAYS * 24 * 60 * 60 * 1000);
};

const selectPlayableRecording = (recordings = []) => {
  return recordings.find((file) => file.file_type === "MP4" && file.download_url)
    || recordings.find((file) => file.file_type === "MP4")
    || recordings.find((file) => file.download_url)
    || recordings[0];
};

const attachCloudRecording = async (liveClass) => {
  if (!liveClass.zoomMeetingId) return false;

  const recordings = await zoomHelper.getMeetingRecordings(liveClass.zoomMeetingId);
  const playableRecording = selectPlayableRecording(recordings);
  const recordingUrl = playableRecording?.play_url || playableRecording?.download_url;
  if (!recordingUrl) return false;

  liveClass.zoomCloudRecordingUrl = recordingUrl;
  liveClass.recordingUrl = `/classes/${liveClass._id}/recording-stream`;
  liveClass.recordingExpiryDate = getRecordingExpiryDate(liveClass);
  liveClass.status = "recorded";
  await liveClass.save();
  return true;
};

const initScheduler = () => {
  console.log("Initializing scheduler (Asia/Kolkata timezone)...");

  // 1. Live Class Reminders: Runs every minute
  cron.schedule(
    "* * * * *",
    async () => {
      try {
        const now = new Date();
        const targetTime = new Date(now.getTime() + 10 * 60 * 1000); // exactly 10 minutes from now

        // Find classes starting in the next 10 minutes that haven't had reminders sent
        const upcomingClasses = await LiveClass.find({
          date: { $gte: now, $lte: targetTime },
          reminderSent: false,
        });

        if (upcomingClasses.length === 0) return; // No classes to process

        let totalNotificationsCreated = 0;

        for (const liveClass of upcomingClasses) {
          const batch = await Batch.findById(liveClass.batchId);
          if (!batch || !batch.students || batch.students.length === 0) continue; // Skip if no batch or students

          const notificationsToCreate = [];

          // Create notification for each student
          batch.students.forEach((studentId) => {
            notificationsToCreate.push({
              userId: studentId,
              message: `Your class on "${liveClass.topic || 'a scheduled topic'}" starts in 10 minutes.`,
              type: "class_reminder",
            });
          });

          // Optionally add teacher notification
          if (liveClass.teacherId) {
            notificationsToCreate.push({
              userId: liveClass.teacherId,
              message: `You have a class on "${liveClass.topic || 'a scheduled topic'}" starting in 10 minutes.`,
              type: "class_reminder",
            });
          }

          if (notificationsToCreate.length > 0) {
            // Bulk insert notifications safely, ignore duplicates/errors on individual docs
            await Notification.insertMany(notificationsToCreate, { ordered: false }).catch(err => {
              console.warn("Scheduler: Some duplicates ignored during bulk insert.");
            });
            totalNotificationsCreated += notificationsToCreate.length;
          }
          
          // Mark reminder as sent only after successful creation (or safely skipped due to empty classes)
          liveClass.reminderSent = true;
          await liveClass.save();
        }
        
        console.log(`[Scheduled Job] Class Reminders: Processed ${upcomingClasses.length} classes, created ${totalNotificationsCreated} notifications.`);
      } catch (error) {
        console.error("Error running Live Class Reminder cron job:", error);
      }
    },
    {
      timezone: "Asia/Kolkata",
    }
  );

  // 2. Daily Study Reminder: Runs at 7:00 PM every day
  cron.schedule(
    "0 19 * * *",
    async () => {
      try {
        console.log("Running Daily Study Reminder cron job...");

        // Find students with enrolled courses
        const activeStudents = await User.find({
          role: "student",
          "enrolledCourses.0": { $exists: true }, // Ensure enrolledCourses array is not empty
        }).select("_id");

        if (activeStudents.length === 0) {
          console.log("[Scheduled Job] Study Reminders: No active students found.");
          return;
        }

        const notificationsToCreate = activeStudents.map((student) => ({
          userId: student._id,
          message: "Time to continue your learning today.",
          type: "study_reminder",
        }));

        await Notification.insertMany(notificationsToCreate, { ordered: false }).catch(err => {
            console.warn("Scheduler: Some duplicates ignored during bulk insert.");
        });

        console.log(`[Scheduled Job] Study Reminders: Created ${notificationsToCreate.length} daily reminders.`);
      } catch (error) {
        console.error("Error running Daily Study Reminder cron job:", error);
      }
    },
    {
      timezone: "Asia/Kolkata",
    }
  );

  // 3. Keep Zoom cloud recordings attached to the platform after classes end.
  cron.schedule(
    "*/5 * * * *",
    async () => {
      try {
        const now = new Date();
        const candidates = await LiveClass.find({
          zoomMeetingId: { $exists: true, $ne: "" },
          status: { $in: ["live", "finished"] },
          zoomCloudRecordingUrl: { $in: [null, ""] }
        });

        let attached = 0;
        for (const liveClass of candidates) {
          const scheduledEnd = new Date(new Date(liveClass.date).getTime() + (Number(liveClass.duration) || 60) * 60000);
          if (scheduledEnd > now) continue;

          if (liveClass.status === "live") {
            liveClass.status = "finished";
            await liveClass.save();
          }

          if (await attachCloudRecording(liveClass)) attached += 1;
        }

        if (attached > 0) {
          console.log(`[Scheduled Job] Zoom Recording Sync: attached ${attached} cloud recordings.`);
        }
      } catch (error) {
        console.error("Error running Zoom Recording Sync cron job:", error);
      }
    },
    {
      timezone: "Asia/Kolkata",
    }
  );

  // 4. Finalize absent attendance after the recording replay window expires.
  cron.schedule(
    "30 1 * * *",
    async () => {
      try {
        const now = new Date();
        const candidateClasses = await LiveClass.find({
          status: { $in: ["finished", "recorded"] },
          date: { $lte: new Date(now.getTime() - RECORDING_ACCESS_DAYS * 24 * 60 * 60 * 1000) }
        }).select("_id batchId date recordingExpiryDate");

        let markedAbsent = 0;

        for (const liveClass of candidateClasses) {
          if (getRecordingExpiryDate(liveClass) > now) continue;

          const batch = await Batch.findById(liveClass.batchId).select("students").lean();
          if (!batch?.students?.length) continue;

          const ops = batch.students.map((studentId) => ({
            updateOne: {
              filter: { classId: liveClass._id, studentId },
              update: { $setOnInsert: { status: "absent" } },
              upsert: true
            }
          }));

          if (ops.length > 0) {
            const result = await Attendance.bulkWrite(ops);
            markedAbsent += result.upsertedCount || 0;
          }
        }

        if (candidateClasses.length > 0) {
          console.log(`[Scheduled Job] Attendance Finalizer: marked ${markedAbsent} students absent.`);
        }
      } catch (error) {
        console.error("Error running Attendance Finalizer cron job:", error);
      }
    },
    {
      timezone: "Asia/Kolkata",
    }
  );
};

module.exports = initScheduler;
