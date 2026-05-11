"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiRequest } from "@/lib/api";
import ZoomMeetingSDK from "@/components/ZoomMeetingSDK";
import { Loader2 } from "lucide-react";

type LiveClassSummary = {
  _id: string;
  zoomLink?: string;
  zoomStartUrl?: string;
  zoomMeetingId?: string;
  zoomPassword?: string;
  topic?: string;
  duration?: number;
};

type UserProfile = {
  name?: string;
  email?: string;
};

const getErrorMessage = (error: unknown) => {
  return error instanceof Error ? error.message : "Unable to load live session";
};

export default function TeacherZoomPage() {
  const { classId } = useParams();
  const resolvedClassId = Array.isArray(classId) ? classId[0] : classId;
  const [liveClass, setLiveClass] = useState<LiveClassSummary | null>(null);
  const [teacherProfile, setTeacherProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, classRes] = await Promise.all([
          apiRequest("/auth/me"),
          apiRequest("/classes/teacher"),
        ]);

        if (!profileRes.success) throw new Error("Failed to load profile");
        setTeacherProfile(profileRes.user);

        if (!classRes.success) throw new Error("Failed to load classes");
        const currentClass = (classRes.data as LiveClassSummary[]).find((c) => c._id === resolvedClassId);
        if (!currentClass) throw new Error("Class not found");

        setLiveClass(currentClass);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [resolvedClassId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-screen bg-[#0b0c10]">
        <Loader2 className="w-12 h-12 animate-spin text-blue-400 mb-4" />
        <p className="text-gray-400 text-sm">Loading Live Session...</p>
      </div>
    );
  }

  if (error || !liveClass || !teacherProfile) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-[#0b0c10]">
        <div className="p-8 text-center max-w-md bg-red-950/40 border border-red-500/20 rounded-3xl">
          <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Session</h2>
          <p className="text-gray-400">{error || "Missing session data"}</p>
          <a href="/teacher/live" className="inline-block mt-6 px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors text-sm font-bold">
            ← Back to Live Control
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-black">
      <ZoomMeetingSDK
        classId={resolvedClassId || ""}
        meetingNumber={liveClass.zoomMeetingId?.toString() || ""}
        password={liveClass.zoomPassword || ""}
        userName={teacherProfile.name || "Teacher"}
        userEmail={teacherProfile.email || ""}
        role={1}
        leaveUrl="/teacher/live"
        zoomStartUrl={liveClass.zoomStartUrl || liveClass.zoomLink}
        zoomJoinUrl={liveClass.zoomLink}
        topic={liveClass.topic}
        duration={liveClass.duration}
      />
    </div>
  );
}
