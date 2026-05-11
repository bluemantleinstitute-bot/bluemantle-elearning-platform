"use client";

import { useEffect, useState, use } from "react";
import { ArrowLeft, Clock, Calendar, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import dynamic from 'next/dynamic';
import { apiRequest } from "@/lib/api";

const PremiumVideoPlayer = dynamic(
  () => import("@/components/PremiumVideoPlayer").then(mod => mod.PremiumVideoPlayer),
  { ssr: false, loading: () => <div className="aspect-video bg-black rounded-2xl animate-pulse" /> }
);

export default function LiveRecordingPlayer({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = use(params);
  const [recording, setRecording] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [attendanceMarked, setAttendanceMarked] = useState(false);

  const markReplayAttendance = async () => {
    if (attendanceMarked) return;
    try {
      const res = await apiRequest("/classes/watch-recording", {
        method: "POST",
        body: JSON.stringify({ classId }),
      });
      if (res.success) {
        setAttendanceMarked(true);
      }
    } catch (err) {
      console.error("Failed to mark attendance for recording:", err);
    }
  };

  useEffect(() => {
    const fetchRecording = async () => {
      try {
        const classes = await db.user.getLiveClasses();
        const rec = classes.find((c: any) => c._id === classId);
        setRecording(rec);
      } catch (error) {
        console.error("Failed to fetch recording:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecording();
  }, [classId]);

  const handleVideoEnd = markReplayAttendance;

  if (loading) return <div className="h-screen flex items-center justify-center animate-pulse">Loading Recording...</div>;
  if (!recording || !recording.recordingUrl) return <div className="h-screen flex items-center justify-center">Recording not found</div>;

  const recordingUrl = recording.recordingUrl;
  const isYouTubeRecording = recordingUrl.includes("youtube.com") || recordingUrl.includes("youtu.be");

  return (
    <div className="fixed inset-0 bg-background z-[100] flex flex-col">
      <header className="h-16 border-b border-outline_variant/20 bg-surface_container_lowest flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/student/live/recordings" className="p-2 hover:bg-surface_container_high rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-on_surface" />
          </Link>
          <div className="h-8 w-px bg-outline_variant/20 mx-2" />
          <h1 className="font-manrope font-bold text-lg truncate max-w-md">{recording.topic}</h1>
        </div>
        <div className="flex items-center gap-4">
          {attendanceMarked && (
             <div className="flex items-center gap-2 text-success bg-success/10 px-3 py-1.5 rounded-full">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Attendance Logged</span>
             </div>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-black flex flex-col relative">
        <div className="flex-1 flex items-center justify-center relative p-4 md:p-12">
           {isYouTubeRecording ? (
             <PremiumVideoPlayer 
                url={recordingUrl} 
                title={recording.topic}
                onEnded={handleVideoEnd}
             />
           ) : (
             <a
               href={recordingUrl}
               target="_blank"
               rel="noopener noreferrer"
               onClick={markReplayAttendance}
               className="px-6 py-3 rounded-xl bg-primary text-on_primary font-bold text-sm"
             >
               Open Secure Recording
             </a>
           )}
        </div>
        <div className="bg-surface_container_lowest p-8 shrink-0">
           <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-manrope font-bold mb-4">{recording.topic}</h2>
              <div className="flex items-center gap-6 text-on_surface_variant text-sm mb-8">
                 <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {recording.duration} mins</span>
                 <span className="w-1.5 h-1.5 rounded-full bg-outline_variant/40" />
                 <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {new Date(recording.date).toLocaleDateString()}</span>
              </div>
              <div className="space-y-4">
                 <h4 className="font-bold">Important Notice</h4>
                 <p className="text-on_surface_variant leading-relaxed">
                    You must watch this recording until the very end to have your attendance securely logged into the system. If watched within 7 days of the live broadcast, you will be marked as "Late" instead of "Absent".
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
