# Live Class Workflow Status

Last updated: 2026-05-10

## Scope

This document captures the current implementation status for the live class scheduling, Zoom meeting, recording, attendance, batch, and access-control workflow.

## Implemented Changes

### Backend

- Added live class metadata fields in `Bluemantle-backend/models/LiveClass.js`:
  - `zoomCloudRecordingUrl`
  - `recordingExpiryDate`
  - `createdBy`
  - `createdByRole`
- Hardened live class scheduling in `Bluemantle-backend/controllers/liveClassController.js`:
  - Admin/owner can schedule classes for a selected batch and teacher.
  - Teacher can schedule only for batches assigned to that teacher.
  - Admin-created classes now resolve to the assigned batch teacher when needed.
  - Overlap checks now block conflicts only for the same teacher or same batch.
  - Parallel classes are allowed when they use different teachers and batches.
- Added student access validation before live join or replay:
  - User must be logged in.
  - User must be a student.
  - Student must belong to the class batch.
  - Student must have access to the course linked to the batch.
- Protected Zoom join links:
  - Student class listing no longer returns Zoom join/start links.
  - Student receives the Zoom join URL only after `/api/classes/join-live` validates access.
- Implemented attendance rules:
  - `Join Live` marks attendance as `present`.
  - Watching an available recording marks attendance as `late` unless already `present`.
  - Expired replay access creates or preserves `absent`.
  - `present` is not downgraded to `late`.
- Added Zoom cloud recording sync:
  - New endpoint: `POST /api/classes/:id/sync-recording`
  - Fetches Zoom cloud recording files and attaches a playable URL when Zoom processing is complete.
  - Sets a 7-day `recordingExpiryDate`.
- Updated class finish flow:
  - Finishing a class attempts to attach the Zoom cloud recording.
  - If Zoom has not processed it yet, class still finishes and the recording can be synced later.
- Added scheduled absence finalizer in `Bluemantle-backend/utils/scheduler.js`:
  - Runs daily.
  - After the replay window expires, students with no live/replay attendance are marked `absent`.

### Frontend

- Updated teacher schedule page:
  - Shows clear error/empty states when a teacher has no assigned batches.
  - Disables scheduling if no batch is assigned.
  - Supports manual YouTube recording upload.
  - Adds Zoom cloud recording sync action for finished meetings.
- Updated teacher live page:
  - Selects the nearest actionable class.
  - Shows a clear message if no classes are assigned to the teacher account.
- Updated student live page:
  - Shows active live sessions.
  - Shows upcoming scheduled sessions.
  - Shows temporary recordings with replay expiry information.
- Updated student Zoom page:
  - Calls `/api/classes/join-live` before opening Zoom.
  - Uses the backend-validated join URL instead of trusting class-list data.
- Updated student recordings:
  - Recording gallery hides expired recordings.
  - Recording page calls `/api/classes/watch-recording`.
  - YouTube recordings play in the embedded player.
  - Non-YouTube Zoom cloud links open as secure external recordings and trigger replay attendance.

## Current Status

### Working

- Backend can start successfully.
- MongoDB DNS issue was handled with explicit DNS resolver setup in `server.js`.
- Live class scheduling model supports required fields:
  - class title/topic
  - teacher ID
  - batch ID
  - scheduled date
  - Zoom meeting ID
  - Zoom join URL
  - recording URL
  - status
  - created-by metadata
- Batch-scoped scheduling and attendance are supported.
- Multiple teachers can run parallel sessions as long as they do not conflict with the same batch or same teacher.
- Live attendance and replay attendance logic are implemented server-side.
- Student Zoom links are no longer publicly exposed through the class list.

## Database Audit Status

An audit script has been added at `Bluemantle-backend/audit_live_class_data.js`.

Run audit-only mode:

```bash
node audit_live_class_data.js
```

Run deterministic repair mode:

```bash
node audit_live_class_data.js --fix
```

The `--fix` mode only repairs deterministic relationship problems, such as:

- A student profile has `batchId`, but the batch does not include the student in `Batch.students`.
- A live class teacher does not match the selected batch teacher.

It does not invent Zoom meeting IDs or Zoom join links.

### Current Database Issues Found

Current counts:

- Users: 14
- Batches: 3
- Courses: 5
- Live classes: 14
- Attendance records: 7

Issues found:

- `Past Session 1`, `Past Session 2`, and `Past Session 3` point to `Julian Chen`, who is a student, as `teacherId`.
- Those same past sessions do not match their batch teacher, which is `Prof. Adrian Vance`.
- Those same past sessions are missing Zoom meeting data.
- `Live Trading Session with Mentor`, `Live Trading Session Day 2`, and `Live Trading Session Day 3` are missing Zoom meeting data.

### Database Impact

The teacher mismatch causes schedules and recordings to appear under the wrong account or disappear from the expected teacher view.

Missing Zoom meeting data means those legacy/seeded classes cannot be used for real start/join flows. They need to be either:

- deleted and recreated through the platform scheduler, or
- updated with real Zoom meeting data from an actual Zoom meeting.

### Partially Implemented

- Zoom cloud recording sync is implemented, but depends on Zoom cloud recording availability and account permissions.
- Teacher/admin can paste a YouTube recording link manually.
- Attendance finalization runs through the app scheduler, so it requires the backend process to be running.

### Not Implemented Yet

- Admin co-host controls:
  - kick/remove students
  - mute/unmute users
  - waiting room management
- These controls cannot be safely implemented through plain Zoom start/join URLs. They require a proper Zoom Meeting SDK host/co-host control flow or a supported Zoom API/webhook design.
- Automatic YouTube upload is not implemented.
  - Current supported workflow is Zoom cloud sync or manual unlisted YouTube link paste.
- Full production test suite for live-class flows is not added yet.

## Required Test Checklist

### Scheduling

- Admin schedules a class for a batch and assigned teacher.
- Teacher schedules a class only for assigned batches.
- Teacher cannot schedule for unassigned batches.
- Same teacher cannot schedule overlapping live classes.
- Same batch cannot have overlapping live classes.
- Different teachers with different batches can schedule parallel classes.

### Live Join

- Correct student can join live class.
- Student from another batch is blocked.
- Student without course access is blocked.
- Unauthenticated user is blocked.
- Joining live class marks attendance `present`.
- Present attendance is not overwritten by replay watch.

### Recording

- Finishing class attempts Zoom cloud recording sync.
- Manual YouTube recording upload marks class as recorded.
- Recording appears only for assigned batch students.
- Recording is visible only within the 7-day replay window.
- Expired recording is hidden from student UI.

### Attendance

- Student who joins live is `present`.
- Student who misses live but watches recording within 7 days is `late`.
- Student who misses live and does not watch within 7 days becomes `absent`.
- Student already marked `present` stays `present` after replay.

## Known Existing Verification Issues

Backend syntax checks passed for the changed backend files.

Frontend TypeScript check is still blocked by existing unrelated errors:

- `src/app/admin/students/page.tsx` references missing `cohort`.
- Several student pages have implicit `any` parameters.
- `src/app/teacher/qa/page.tsx` has a `string` to `never` type issue.
- `src/lib/server-db.ts` mock registry shape is missing fields.

These are outside the live-class workflow changes but should be fixed before a clean production build.

## Operational Notes

- Students should always join through the dashboard, not direct Zoom links.
- Zoom links should remain hidden from public pages and only be returned after backend validation.
- For true parallel Zoom hosting, each simultaneous teacher needs a licensed Zoom host account that supports the required meeting and cloud recording behavior.
- The backend must remain running for reminders and absent-finalization jobs to execute.
