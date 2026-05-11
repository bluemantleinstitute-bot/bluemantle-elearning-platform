# Bluemantle API Postman Documentation

This document provides all the endpoints created for the Bluemantle platform, including sample requests and expected responses.

## 1. Authentication (`/api/auth`)

### Login
*   **Endpoint**: `POST /api/auth/login`
*   **Description**: Authenticates a user and returns a JWT. If a new device is detected, it requests OTP.
*   **Body**:
    ```json
    {
      "userId": "STU-1001",
      "password": "password123",
      "deviceId": "OPTIONAL_UNIQUE_DEVICE_ID"
    }
    ```
*   **Success Response**:
    ```json
    {
      "success": true,
      "token": "JWT_TOKEN_HERE",
      "user": {
        "userId": "STU-1001",
        "name": "John Doe",
        "role": "student"
      }
    }
    ```
*   **New Device Response**:
    ```json
    {
      "success": false,
      "requireOtp": true,
      "message": "New device detected. An OTP has been sent to your email."
    }
    ```

### Verify OTP
*   **Endpoint**: `POST /api/auth/verify-otp`
*   **Description**: Verifies the 6-digit OTP sent to the user's email for new device authorization.
*   **Body**:
    ```json
    {
      "userId": "STU-1001",
      "otp": "123456",
      "deviceId": "DEVICE_ID"
    }
    ```

---

## 2. Admin Management (`/api/admin`)

### Create Teacher
*   **Endpoint**: `POST /api/admin/create-teacher`
*   **Description**: Creates a new Teacher profile.
*   **Body**:
    ```json
    {
      "name": "Jane Teacher",
      "email": "jane@academy.edu",
      "password": "teacherpassword"
    }
    ```

### Create Student
*   **Endpoint**: `POST /api/admin/create-student`
*   **Description**: Creates a new Student profile.
*   **Body**:
    ```json
    {
      "name": "John Student",
      "email": "john@academy.edu",
      "password": "studentpassword"
    }
    ```

### Get Teachers
*   **Endpoint**: `GET /api/admin/teachers`
*   **Description**: Fetches a list of all teachers.

---

## 3. Courses, Modules & Videos

### Courses (`/api/courses`)

#### Create Course (Admin)
*   **Endpoint**: `POST /api/courses`
*   **Body**:
    ```json
    {
      "title": "Stock Market Mastery",
      "description": "Learn professional trading",
      "price": 999,
      "isPaid": true,
      "duration": "4 Weeks"
    }
    ```

#### Update Course (Admin)
*   **Endpoint**: `PUT /api/courses/:id`
*   **Body**: Same as Create Course (Partial updates allowed).

#### Delete Course (Admin)
*   **Endpoint**: `DELETE /api/courses/:id`
*   **Description**: Performs a soft-delete (isActive: false).

#### Restore Course (Admin)
*   **Endpoint**: `POST /api/courses/:id/restore`

#### Get All Courses
*   **Endpoint**: `GET /api/courses`

#### Get Course Details
*   **Endpoint**: `GET /api/courses/:id`
*   **Description**: Returns aggregated details (Modules, Videos, Notes). Requires enrollment/access.

#### Get Course Videos/Notes Directly
*   **Endpoint**: `GET /api/courses/:id/videos`
*   **Endpoint**: `GET /api/courses/:id/notes`

### Modules (`/api/modules`)

#### Create Module (Admin)
*   **Endpoint**: `POST /api/modules`
*   **Body**:
    ```json
    {
      "courseId": "COURSE_ID",
      "title": "Introduction to TA",
      "order": 1
    }
    ```

#### Get Modules for Course
*   **Endpoint**: `GET /api/modules/:courseId`

### Videos (`/api/videos`)

#### Add Video (Admin)
*   **Endpoint**: `POST /api/videos`
*   **Body**:
    ```json
    {
      "title": "Candlestick Basics",
      "youtubeId": "VIDEO_ID",
      "courseId": "COURSE_ID",
      "moduleId": "MODULE_ID",
      "order": 1,
      "duration": "15:00",
      "description": "Video description"
    }
    ```

#### Update Video (Admin)
*   **Endpoint**: `PUT /api/videos/:id`

#### Delete Video (Admin)
*   **Endpoint**: `DELETE /api/videos/:id`

#### Get Video Details
*   **Endpoint**: `GET /api/videos/:id`
*   **Description**: Fetches video details. Returns `403 Locked` if the student hasn't completed the previous video.

---

## 4. Batches (`/api/batches`)

### Create Batch (Admin)
*   **Endpoint**: `POST /api/batches`
*   **Body**:
    ```json
    {
      "name": "Elite Traders April",
      "courseId": "COURSE_ID",
      "maxStudents": 50,
      "startDate": "2024-04-01",
      "endDate": "2024-06-01"
    }
    ```

### List Batches (Admin)
*   **Endpoint**: `GET /api/batches`

### Get Batch Details
*   **Endpoint**: `GET /api/batches/:id`

### Assign/Remove Teacher (Admin)
*   **Endpoint**: `POST /api/batches/:id/assign-teacher`
*   **Body**: `{ "teacherId": "USER_ID" }`
*   **Endpoint**: `POST /api/batches/:id/remove-teacher`

### Add/Remove Students (Admin)
*   **Endpoint**: `POST /api/batches/:id/add-students`
*   **Body**: `{ "studentIds": ["ID1", "ID2"] }`
*   **Endpoint**: `POST /api/batches/:id/remove-student`
*   **Body**: `{ "studentId": "ID1" }`

---

## 5. User Management (`/api/users`)

### Create User
*   **Endpoint**: `POST /api/users`
*   **Description**: General user creation.
*   **Body**:
    ```json
    {
      "name": "Jane Smith",
      "email": "jane@academy.edu",
      "password": "password123",
      "role": "student"
    }
    ```

### Get Users
*   **Endpoint**: `GET /api/users`
*   **Query Params**: `role` (optional), `batchId` (optional)
*   **Description**: Fetches a list of users. Includes `id`, `role`, `name`, `email`, `userId`, `cohort`, `status`, `title`, `level`, `totalXP`, and `lastActive`.

### Get Students by Batch
*   **Endpoint**: `GET /api/users/students/batch/:batchId`
*   **Description**: Fetches all students belonging to a specific batch.
*   **Success Response**:
    ```json
    {
      "success": true,
      "students": [
        {
          "id": "USER_ID",
          "name": "John Student",
          "email": "john@academy.edu",
          "userId": "STU-1001",
          "cohort": "Elite Traders April",
          "status": "active",
          "level": "Beginner",
          "totalXP": 150
        }
      ]
    }
    ```

---

## 6. Live Classes & Attendance

### Live Classes (`/api/classes`)

#### Schedule Live Class (Admin)
*   **Endpoint**: `POST /api/classes`
*   **Body**:
    ```json
    {
      "batchId": "BATCH_ID",
      "teacherId": "TEACHER_ID",
      "zoomLink": "https://zoom.us/j/...",
      "topic": "Live Trading Session",
      "date": "2024-04-15T10:00:00Z",
      "duration": 60
    }
    ```

#### Join Live Class
*   **Endpoint**: `POST /api/classes/join-live`
*   **Description**: Marks student as "Present". Only works if class status is "live".
*   **Body**: `{ "classId": "CLASS_ID" }`

#### Watch Recording
*   **Endpoint**: `POST /api/classes/watch-recording`
*   **Description**: Marks student as "Late" if watched within 7 days of original date.
*   **Body**: `{ "classId": "CLASS_ID" }`

#### Update Class Status (Teacher/Admin)
*   **Endpoint**: `PUT /api/classes/:classId/status`
*   **Description**: Used to start a live session or add a recording link.
*   **Body**:
    ```json
    {
      "status": "recorded",
      "recordingUrl": "https://youtube.com/unlisted-link"
    }
    ```

### Attendance (`/api/attendance`)

#### Bulk Mark Attendance (Teacher)
*   **Endpoint**: `POST /api/attendance/mark`
*   **Body**:
    ```json
    {
      "classId": "CLASS_ID",
      "records": [
        { "studentId": "S1", "status": "present" },
        { "studentId": "S2", "status": "absent" }
      ]
    }
    ```

#### Get Attendance
*   **Endpoint**: `GET /api/attendance/student/:id`
*   **Endpoint**: `GET /api/attendance/class/:id`

---

## 7. Dashboard & Progress

### Dashboard (`/api/dashboard`)

#### Student Dashboard
*   **Endpoint**: `GET /api/dashboard/student`
*   **Description**: Aggregates profile, progress, upcoming classes, reminders, announcements, and market news.

#### Teacher Dashboard
*   **Endpoint**: `GET /api/dashboard/teacher`
*   **Description**: Aggregates assigned batches, student counts, today's classes, and attendance summary.

### Progress (`/api/progress`)

#### Watch Video (Update Progress)
*   **Endpoint**: `POST /api/progress/watch-video`
*   **Description**: Marks a video as watched. **Requirement**: Previous video must be watched first.
*   **Body**:
    ```json
    {
      "courseId": "COURSE_ID",
      "moduleId": "MODULE_ID",
      "videoId": "VIDEO_ID"
    }
    ```

#### Get Course Progress
*   **Endpoint**: `GET /api/progress/course/:courseId`

#### Get User Progress (Admin/Teacher)
*   **Endpoint**: `GET /api/progress/user/:userId`

---

## 8. Institutional Actions (`/api/institutional`)

### Get Registry Payload
*   **Endpoint**: `GET /api/institutional`
*   **Description**: Fetches the full centralized registry (Students, Batches, Schedule, Appeals, Catalog, Progress).

### Dispatch Action
*   **Endpoint**: `POST /api/institutional`
*   **Description**: Universal action dispatcher.
*   **Body Examples**:
    *   **Ignite Session**: `{ "action": "ignite", "payload": { "batchId": "..." } }`
    *   **Halt Session**: `{ "action": "halt", "payload": { "batchId": "..." } }`
    *   **Suspend Student**: `{ "action": "suspend", "payload": { "studentId": "..." } }`
    *   **Reactivate Student**: `{ "action": "reactivate", "payload": { "studentId": "..." } }`
    *   **Submit Appeal**: `{ "action": "appeal", "payload": { "reason": "..." } }`
    *   **Resolve Appeal**: `{ "action": "resolveAppeal", "payload": { "appealId": "...", "decision": "approved|rejected" } }`

---

## 9. Notifications (`/api/notifications`)

### Get Notifications
*   **Endpoint**: `GET /api/notifications`
*   **Query Params**: `page`, `limit`

### Mark as Read
*   **Endpoint**: `POST /api/notifications/read`
*   **Body**: `{ "notificationId": "...", "markAll": false }`

---

## 10. Others

### Teacher Profile (`/api/teacher`)
*   **Endpoint**: `PUT /api/teacher/profile`
*   **Body**: `{ "name": "...", "email": "...", "linkedin": "...", "description": "...", "title": "..." }`

### Notes (`/api/notes`)
#### Create Note (Admin)
*   **Endpoint**: `POST /api/notes`
*   **Body**:
    ```json
    {
      "title": "Module 1 Summary",
      "fileUrl": "/uploads/note.pdf",
      "courseId": "COURSE_ID",
      "moduleId": "MODULE_ID"
    }
    ```

### Upload File (`/api/upload`)
*   **Endpoint**: `POST /api/upload`
*   **Body**: `multipart/form-data` with key `file`.

### Test Routes (`/api/test`)
*   **Endpoint**: `GET /api/test/protected`
*   **Endpoint**: `GET /api/test/admin`
