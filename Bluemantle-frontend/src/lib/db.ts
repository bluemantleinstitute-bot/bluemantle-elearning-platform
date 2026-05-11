import { apiRequest } from "./api";

const getClassEndTime = (liveClass: any) => {
  const start = new Date(liveClass.date).getTime();
  const duration = Number(liveClass.duration) || 60;
  return start + duration * 60000;
};

export const mockDb = {
  // Keep mockDb for initial structure reference if needed, 
  // but the 'db' export will now fetch real data.
  profile: {
    name: "Loading...",
    level: "...",
    joined: "...",
    totalXP: "0",
    batch: "...",
    teacher: "..."
  },
  attendance: {
    totalClasses: 0,
    attended: 0,
    rate: "0%",
    records: []
  },
  courses: [],
  reminders: [],
  announcements: [],
  marketNews: [],
  upcomingLiveClass: null,
  recordings: []
};

const normalizeStudentData = (backendData: any) => {
  return {
    profile: {
      ...backendData.profile,
      name: backendData.profile.name || "Student",
      joined: backendData.profile.joined ? new Date(backendData.profile.joined).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "January 2026",
    },
    upcomingLiveClass: (() => {
      const allClasses = [...(backendData.upcomingClasses || [])].sort(
        (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      const liveNow = allClasses.find((c: any) => c.status === 'live');
      const nextScheduled = allClasses.find((c: any) => (
        c.status === 'scheduled' && getClassEndTime(c) >= Date.now()
      ));
      const next = liveNow || nextScheduled;
      
      if (!next) return null;
      const diffMs = new Date(next.date).getTime() - Date.now();
      const diffMins = Math.max(0, Math.floor(diffMs / 60000));
      let countdown = diffMs <= 0 ? "Awaiting Start" : diffMins < 60 ? `${diffMins}m` : `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;
      
      if (next.status === 'finished') countdown = "Finished";
      if (next.status === 'live') countdown = "Live Now";
      return {
        id: next._id,
        title: next.topic,
        instructor: next.teacherId?.name || "Assigning...",
        batch: next.batchId?.name || "Generic",
        status: next.status,
        countdown
      };
    })(),
    courses: backendData.enrolledCourses.map((c: any) => ({
      id: c._id,
      name: c.title,
      progress: parseFloat(backendData.progress[c._id]) || 0,
      modulesCompleted: 0, // Would need more specific progress API
      totalModules: 0
    })),
    attendance: {
      totalClasses: backendData.attendanceSummary.totalClasses,
      attended: backendData.attendanceSummary.present,
      rate: `${backendData.attendanceSummary.percentage}%`,
      records: [] // Backend attendance route can fetch this
    },
    reminders: backendData.reminders.map((r: any) => ({
      id: r._id,
      title: r.title,
      type: r.type,
      date: new Date(r.createdAt).toLocaleDateString(),
      status: r.status === "unread" ? "info" : "neutral"
    })),
    announcements: backendData.announcements.map((a: any) => ({
      id: a._id,
      title: a.title,
      content: a.message,
      time: new Date(a.createdAt).toLocaleTimeString()
    })),
    marketNews: backendData.marketNews.map((n: any) => ({
      id: n._id,
      tag: n.category,
      title: n.title,
      abstract: n.content,
      time: "Recent",
      trending: n.isTrending
    })),
    recordings: (backendData.recordings || []).map((v: any) => ({
      title: v.title,
      duration: v.duration,
      time: new Date(v.createdAt).toLocaleDateString()
    })),
    schedule: [...(backendData.upcomingClasses || [])]
      .filter((c: any) => ["scheduled", "live"].includes(c.status) && getClassEndTime(c) >= Date.now())
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((c: any) => ({
      date: new Date(c.date).toLocaleDateString(),
      time: new Date(c.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      teacher: c.teacherId?.name || "Assigning...",
      batch: c.batchId?.name || "Generic",
      topic: c.topic
    })),
    activeDevice: backendData.activeDevice ? {
      name: "Primary Terminal",
      hardwareId: backendData.activeDevice.id,
      lastActive: new Date(backendData.activeDevice.lastActive).toLocaleString()
    } : null
  };
};

const normalizeTeacherData = (backendData: any) => {
  return {
    profile: backendData.profile,
    assignedBatches: backendData.assignedBatches,
    assignedCourses: backendData.assignedCourses || [],
    studentCount: backendData.studentCount,
    todayClasses: backendData.todayClasses.map((c: any) => ({
      _id: c._id,
      batchId: c.batchId._id || c.batchId,
      time: new Date(c.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      title: c.topic,
      location: c.batchId.name,
      students: `${c.duration} mins`,
      status: c.status
    })),
    upcomingSessions: backendData.upcomingClasses.map((c: any) => ({
      date: new Date(c.date).toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      title: c.topic,
      location: c.batchId.name
    })),
    attendanceSummary: backendData.attendanceSummary
  };
};

// Real async DB service
export const db = {
  user: {
    getStudentData: async () => {
      const response = await apiRequest("/dashboard/student", { cache: 'no-store' } as any);
      return normalizeStudentData(response.data);
    },
    getTeacherData: async () => {
      const response = await apiRequest("/dashboard/teacher");
      return normalizeTeacherData(response.data);
    },
    getAdminDevices: async () => {
      const response = await apiRequest("/admin/devices"); 
      return response.data;
    },
    submitDoubt: async (doubtData: any) => {
      const response = await apiRequest("/doubts", {
        method: "POST",
        body: JSON.stringify(doubtData),
      });
      return response.data;
    },
    getMyDoubts: async () => {
      const response = await apiRequest("/doubts/my");
      return response.data;
    },
    getAllDoubts: async () => {
      const response = await apiRequest("/doubts/all");
      return response.data;
    },
    respondToDoubt: async (id: string, responseData: any) => {
      const response = await apiRequest(`/doubts/respond/${id}`, {
        method: "PUT",
        body: JSON.stringify(responseData),
      });
      return response.data;
    },
    getDoubtStats: async () => {
      const response = await apiRequest("/doubts/stats");
      return response.data;
    },

    // Materials Management
    getAllVideos: async () => {
      const response = await apiRequest("/videos");
      return response.data;
    },
    deleteVideo: async (id: string) => {
      const response = await apiRequest(`/videos/${id}`, {
        method: "DELETE"
      });
      return response.success;
    },
    getAllNotes: async () => {
      const response = await apiRequest("/notes");
      return response.data;
    },
    deleteNote: async (id: string) => {
      const response = await apiRequest(`/notes/${id}`, {
        method: "DELETE"
      });
      return response.success;
    },
    getBatches: async () => {
      const response = await apiRequest("/batches");
      return response.data;
    },
    getBatchDetails: async (batchId: string) => {
      const response = await apiRequest(`/batches/${batchId}`);
      return response.data;
    },
    createBatch: async (payload: any) => {
      const response = await apiRequest("/batches", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      return response.data;
    },
    updateBatch: async (batchId: string, payload: any) => {
      const response = await apiRequest(`/batches/${batchId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      return response.data;
    },
    assignTeacherToBatch: async (batchId: string, teacherId: string) => {
      const response = await apiRequest(`/batches/${batchId}/assign-teacher`, {
        method: "POST",
        body: JSON.stringify({ teacherId })
      });
      return response.data;
    },
    getTeachers: async () => {
      const response = await apiRequest("/users/teachers");
      return response.data;
    },
    // Live Class Management
    getTeacherClasses: async () => {
      const response = await apiRequest("/classes/teacher");
      return response.data;
    },
    getAllLiveClasses: async () => {
      const response = await apiRequest("/classes");
      return response.data;
    },
    scheduleLiveClass: async (payload: { batchId: string, topic: string, date: string, duration: number, teacherId?: string }) => {
      const response = await apiRequest("/classes", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      return response;
    },
    updateLiveClass: async (classId: string, payload: any) => {
      const response = await apiRequest(`/classes/${classId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      return response;
    },
    deleteLiveClass: async (classId: string) => {
      const response = await apiRequest(`/classes/${classId}`, {
        method: "DELETE"
      });
      return response;
    },
    markAsRecorded: async (classId: string, recordingUrl: string) => {
      const response = await apiRequest(`/classes/${classId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: "recorded", recordingUrl })
      });
      return response;
    },
    syncCloudRecording: async (classId: string) => {
      const response = await apiRequest(`/classes/${classId}/sync-recording`, {
        method: "POST"
      });
      return response;
    },
    addStudentsToBatch: async (batchId: string, studentIds: string[]) => {
      const response = await apiRequest(`/batches/${batchId}/add-students`, {
        method: "POST",
        body: JSON.stringify({ studentIds })
      });
      return response.data;
    },
    removeStudentFromBatch: async (batchId: string, studentId: string) => {
      const response = await apiRequest(`/batches/${batchId}/remove-student`, {
        method: "POST",
        body: JSON.stringify({ studentId })
      });
      return response.data;
    },

    finishLiveClass: async (classId: string) => {
      const response = await apiRequest(`/classes/${classId}/finish`, {
        method: "POST"
      });
      return response;
    },
    reigniteLiveClass: async (classId: string) => {
      const response = await apiRequest(`/classes/${classId}/reignite`, {
        method: "POST"
      });
      return response;
    },
    getAttendanceRecords: async () => {
      const response = await apiRequest("/attendance/my-attendance");
      return response.data;
    },
    getLiveClasses: async () => {
      const response = await apiRequest("/classes/my-classes", { cache: 'no-store' } as any);
      return response.data;
    },
    getInstitutionalData: async () => {
      const response = await apiRequest("/institutional");
      return response; 
    },
    getNotes: async () => {
      const response = await apiRequest("/notes/my-notes");
      return response;
    },
    openResource: async (resourceId: string) => {
      const response = await apiRequest(`/notes/${resourceId}/access`);
      return response.url;
    },
    getCatalog: async () => {
      const response = await apiRequest("/courses");
      return response.data;
    },
    getAllCourses: async () => {
      // Admin-only: returns both active and inactive courses
      const response = await apiRequest("/courses?includeInactive=true");
      return response.data;
    },
    restoreCourse: async (courseId: string) => {
      const response = await apiRequest(`/courses/${courseId}/restore`, {
        method: "POST"
      });
      return response;
    },

    getCatalogAdmin: async () => {
      // Fetches all courses (admin route includes isActive=true) and enriches with student count
      const response = await apiRequest("/courses");
      return response.data;
    },
    createCourse: async (payload: { title: string; description?: string; duration?: string; isPaid?: boolean; price?: number }) => {
      const response = await apiRequest("/courses", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      return response;
    },
    updateCourse: async (courseId: string, payload: any) => {
      const response = await apiRequest(`/courses/${courseId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      return response;
    },
    deleteCourse: async (courseId: string) => {
      const response = await apiRequest(`/courses/${courseId}`, {
        method: "DELETE"
      });
      return response;
    },
    getAdminCourseDetails: async (courseId: string) => {
      const response = await apiRequest(`/courses/${courseId}`);
      return response.data;
    },

    getUsers: async (role?: string) => {
      const url = role ? `/users?role=${role}` : "/users";
      const response = await apiRequest(url);
      return response.users || response.data; // Depending on backend response format
    },
    getAdminDashboard: async () => {
      const response = await apiRequest("/dashboard/admin");
      return response.data;
    },
    createUser: async (payload: any) => {
      const response = await apiRequest("/users", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      return response;
    },
    updateUserStatus: async (userId: string, status: string) => {
      const response = await apiRequest(`/users/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      return response;
    },

    updateProgress: async (payload: { courseId: string, moduleId: string, chapterId: string, isCompleted?: boolean }) => {
      const response = await apiRequest("/institutional", {
        method: "POST",
        body: JSON.stringify({
          action: "updateProgress",
          payload
        })
      });
      return response;
    }
  }
};

