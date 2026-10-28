const jwt = require("jsonwebtoken");
const LiveClass = require("../models/LiveClass");
const Batch = require("../models/Batch");
const Attendance = require("../models/Attendance");
const zoomHelper = require("../utils/zoomHelper");

const privilegedRoles = new Set(["admin", "owner"]);
const teacherRoles = new Set(["teacher", "admin", "owner"]);

const sdkKey = () =>
  (process.env.SDK_ID || process.env.ZOOM_MEETING_SDK_KEY || process.env.ZOOM_SDK_KEY || "").trim();
const sdkSecret = () =>
  (process.env.SDK_SECRET || process.env.ZOOM_MEETING_SDK_SECRET || process.env.ZOOM_SDK_SECRET || "").trim();

const sameId = (left, right) => left?.toString() === right?.toString();
const normalizeMeetingNumber = (value) => String(value || "").replace(/\D/g, "");

// Safe diagnostic mask: first 4 + last 4 chars only. Never log secrets, ZAK tokens, or full JWTs.
const maskCredential = (value) => {
  if (!value) return "<empty>";
  if (value.length < 12) return "<set>";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
};

const batchContainsStudent = (batch, userId) => {
  return (batch.students || []).some((studentId) => sameId(studentId, userId));
};

const assertTeacherAccess = async (liveClass, user) => {
  if (!teacherRoles.has(user.role)) {
    return { ok: false, status: 403, message: "Only faculty or admins can host this meeting." };
  }

  if (privilegedRoles.has(user.role) || sameId(liveClass.teacherId, user.id)) {
    return { ok: true };
  }

  const batch = await Batch.findById(liveClass.batchId).select("teacherId").lean();
  if (sameId(batch?.teacherId, user.id)) {
    return { ok: true };
  }

  return { ok: false, status: 403, message: "You can only host sessions assigned to you." };
};

const assertStudentAccess = async (liveClass, userId, userDb) => {
  const batch = await Batch.findById(liveClass.batchId).select("students courseId").lean();
  if (!batch) return { ok: false, status: 404, message: "Batch not found" };

  if (!userDb || userDb.role !== "student") {
    return { ok: false, status: 403, message: "Only enrolled students can join this meeting." };
  }

  const inBatch = batchContainsStudent(batch, userId) || sameId(userDb.batchId, batch._id);
  if (!inBatch) {
    return { ok: false, status: 403, message: "Access denied. Student is not assigned to this batch." };
  }

  return { ok: true };
};

// Meeting SDK JWT per Zoom's current authorization spec (SDK Key migration, enforced June 27 2026):
// payload = appKey, mn, role, iat, exp, tokenExp. The legacy sdkKey claim is removed.
const signMeetingSdkToken = ({ meetingNumber, role }) => {
  const appKey = sdkKey();
  const clientSecret = sdkSecret();

  if (!appKey || !clientSecret) {
    const error = new Error(
      "Zoom Meeting SDK credentials are missing. Set SDK_ID (Client ID) and SDK_SECRET (Client Secret) from the Meeting SDK app's App Credentials page."
    );
    error.status = 500;
    throw error;
  }

  const iat = Math.round(Date.now() / 1000) - 30;
  const exp = iat + 60 * 60 * 2;
  const payload = {
    appKey,
    mn: meetingNumber,
    role,
    iat,
    exp,
    tokenExp: exp,
  };

  const token = jwt.sign(payload, clientSecret, {
    algorithm: "HS256",
    header: { alg: "HS256", typ: "JWT" },
  });

  return {
    signature: token,
    appKeyMask: maskCredential(appKey),
    iat,
    exp,
  };
};

exports.signMeetingSdkToken = signMeetingSdkToken;

exports.generateSignature = async (req, res) => {
  try {
    const { classId, meetingNumber, role } = req.body;
    const requestedRole = Number.parseInt(role, 10) === 1 ? 1 : 0;

    if (!classId) {
      return res.status(400).json({ success: false, message: "classId is required" });
    }

    const liveClass = await LiveClass.findById(classId).populate("teacherId", "email name role");
    if (!liveClass) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    if (!liveClass.zoomMeetingId) {
      return res.status(400).json({ success: false, message: "Zoom meeting is not configured for this class." });
    }

    const requestedMeeting = normalizeMeetingNumber(meetingNumber || liveClass.zoomMeetingId);
    const actualMeeting = normalizeMeetingNumber(liveClass.zoomMeetingId);
    if (requestedMeeting !== actualMeeting) {
      return res.status(403).json({ success: false, message: "Meeting mismatch for this class." });
    }

    if (requestedRole === 1) {
      const access = await assertTeacherAccess(liveClass, req.user);
      if (!access.ok) return res.status(access.status).json({ success: false, message: access.message });

      if (["finished", "recorded"].includes(liveClass.status)) {
        return res.status(400).json({ success: false, message: "This class has already ended." });
      }

      if (liveClass.status === "scheduled") {
        liveClass.status = "live";
        await liveClass.save();
      }
    } else {
      const access = await assertStudentAccess(liveClass, req.user.id, req.userDb);
      if (!access.ok) return res.status(access.status).json({ success: false, message: access.message });

      if (liveClass.status !== "live") {
        return res.status(400).json({ success: false, message: "Class is not currently live" });
      }

      await Attendance.findOneAndUpdate(
        { classId: liveClass._id, studentId: req.user.id },
        { status: "present" },
        { upsert: true, new: true }
      );
    }

    const signed = signMeetingSdkToken({ meetingNumber: actualMeeting, role: requestedRole });
    const hostIdentifier = liveClass.zoomHostEmail || liveClass.teacherId?.email || liveClass.zoomHostId;
    const zak = requestedRole === 1 ? await zoomHelper.getHostZak(hostIdentifier) : null;

    // Safe diagnostics: claim metadata and credential fingerprint only. Never secrets, ZAK, or the JWT.
    console.log(
      `[zoom-signature] appKey=${signed.appKeyMask} mn=${actualMeeting} role=${requestedRole} iat=${signed.iat} exp=${signed.exp} zakIssued=${Boolean(zak)} userId=${req.user.id}`
    );

    res.json({
      success: true,
      signature: signed.signature,
      appKeyMask: signed.appKeyMask,
      meetingNumber: actualMeeting,
      password: liveClass.zoomPassword || "",
      role: requestedRole,
      zak
    });
  } catch (error) {
    console.error("Signature Generation Error:", error);
    res.status(error.status || 500).json({ success: false, message: error.message || "Failed to generate signature" });
  }
};
