"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { KnowledgeCard, CardHeader, CardTitle, CardBody } from "@/components/KnowledgeCard";
import {
  Users, MessageSquare, Zap, ShieldAlert,
  UserX, UserCheck, Activity, Clock, Loader2,
  RefreshCw, BrainCircuit, Send, Wifi, WifiOff, CheckCircle2, AlertCircle
} from "lucide-react";
import { apiRequest } from "@/lib/api";

function ControlCenterContent() {
  const searchParams = useSearchParams();
  const classId = searchParams.get("classId");
  const batchId = searchParams.get("batchId");

  const [students, setStudents] = useState<any[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({});
  const [doubts, setDoubts] = useState<any[]>([]);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [uptime, setUptime] = useState(0); // seconds
  const [isOnline, setIsOnline] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false);
  const startTimeRef = useRef<Date>(new Date());
  const { useRouter } = require("next/navigation");
  const router = useRouter();

  // ─── Uptime timer ────────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setUptime(Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (secs: number) => {
    const h = Math.floor(secs / 3600).toString().padStart(2, "0");
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const handleFinishSession = async () => {
    if (!classId) return;
    const confirmed = window.confirm("Are you sure you want to finish this session? This will lock the meeting and students will no longer be able to enter.");
    if (!confirmed) return;

    try {
      setIsFinishing(true);
      const res = await apiRequest(`/classes/${classId}/finish`, { method: "POST" });
      if (res.success) {
        alert("Session marked as finished.");
        router.push("/teacher");
      } else {
        alert(res.message || "Failed to finish session");
      }
    } catch (err) {
      alert("An error occurred while finishing the session.");
    } finally {
      setIsFinishing(false);
    }
  };

  // ─── Fetch batch students + attendance + doubts ───────────────────────────────
  const fetchLiveData = async () => {
    if (!batchId || !classId) return;
    try {
      setIsOnline(true);

      const [batchRes, attendanceRes, doubtsRes] = await Promise.allSettled([
        apiRequest(`/batches/${batchId}`),
        apiRequest(`/attendance/class/${classId}`),
        apiRequest(`/doubts/all?status=pending&limit=10`),
      ]);

      // Students
      if (batchRes.status === "fulfilled" && batchRes.value.success) {
        const mapped = (batchRes.value.data.students || []).map((s: any) => ({
          id: s._id,
          name: s.name,
          email: s.email,
        }));
        setStudents(mapped);
      }

      // Attendance
      if (attendanceRes.status === "fulfilled" && attendanceRes.value.success) {
        const map: Record<string, string> = {};
        (attendanceRes.value.data || []).forEach((a: any) => {
          const sid = a.studentId?._id?.toString() || a.studentId?.toString();
          if (sid) map[sid] = a.status;
        });
        setAttendanceMap(map);
      }

      // Doubts / Q&A
      if (doubtsRes.status === "fulfilled" && doubtsRes.value.success) {
        setDoubts(doubtsRes.value.data || []);
      }

      setLastRefresh(new Date());
    } catch {
      setIsOnline(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch class info + Ensure it's live
  useEffect(() => {
    const fetchClass = async () => {
      if (!classId) return;
      try {
        const res = await apiRequest(`/classes/${classId}`);
        if (res.success) {
          setClassInfo(res.data);
          // If the teacher has arrived here, the session MUST be live
          if (res.data.status !== 'live') {
             await apiRequest(`/classes/${classId}/status`, {
                method: "PUT",
                body: JSON.stringify({ status: "live" })
             });
          }
        }
      } catch {}
    };
    fetchClass();
  }, [classId]);

  // Initial fetch + auto-refresh every 30 seconds
  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 30000);
    return () => clearInterval(interval);
  }, [batchId, classId]);

  // ─── Derived stats ────────────────────────────────────────────────────────────
  const presentCount = students.filter(s => attendanceMap[s.id] === "present").length;
  const absentCount = students.length - presentCount;
  const attendanceRate = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-on_surface_variant text-sm font-medium">Loading Mission Control...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700 bg-background min-h-screen">

      {/* ── Header ── */}
      <header className="flex justify-between items-center border-b border-outline_variant/10 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-manrope font-black tracking-tight">Mission Control</h1>
            <p className="text-[10px] font-bold text-outline uppercase tracking-[0.2em]">
              {classInfo?.topic || "Live Session Orchestration"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Finish Session Button */}
          <button
            onClick={handleFinishSession}
            disabled={isFinishing}
            className="px-4 py-2 bg-error/10 hover:bg-error/20 text-error border border-error/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isFinishing ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldAlert className="w-3 h-3" />}
            Finish Session
          </button>

          {/* Online indicator */}
          <div className={`flex items-center gap-2 text-xs font-bold ${isOnline ? "text-green-500" : "text-error"}`}>
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            {isOnline ? "Live" : "Disconnected"}
          </div>

          {/* Last refresh */}
          <button
            onClick={fetchLiveData}
            className="flex items-center gap-1.5 text-[10px] font-bold text-outline hover:text-primary transition-colors uppercase tracking-widest"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh · {lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </button>

          {/* Stats */}
          <div className="text-right">
            <p className="text-[10px] font-bold text-outline uppercase">Enrolled</p>
            <p className="text-xl font-black text-on_surface">{students.length}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-outline uppercase">Uptime</p>
            <p className="text-xl font-black text-secondary font-mono">{formatUptime(uptime)}</p>
          </div>
        </div>
      </header>

      {/* ── Stat pills ── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <div>
            <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Present</p>
            <p className="text-2xl font-black text-green-500">{presentCount}</p>
          </div>
        </div>
        <div className="p-4 bg-error/10 border border-error/20 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-error" />
          <div>
            <p className="text-[10px] font-bold text-error uppercase tracking-widest">Not Joined</p>
            <p className="text-2xl font-black text-error">{absentCount}</p>
          </div>
        </div>
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-center gap-3">
          <Activity className="w-5 h-5 text-primary" />
          <div>
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Attendance Rate</p>
            <p className="text-2xl font-black text-primary">{attendanceRate}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">

        {/* ── Left: Doubts / Q&A Stream ── */}
        <div className="col-span-8 space-y-6">
          <KnowledgeCard>
            <CardHeader className="flex justify-between items-center">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                Live Q&A Stream
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{doubts.length} pending</span>
              </CardTitle>
              <button onClick={fetchLiveData} className="text-[10px] text-outline hover:text-primary transition-colors font-bold uppercase">
                Refresh
              </button>
            </CardHeader>
            <CardBody className="h-[420px] overflow-y-auto pr-2 space-y-4">
              {doubts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare className="w-8 h-8 text-outline/30 mb-3" />
                  <p className="text-on_surface_variant text-sm font-medium">No pending questions yet</p>
                  <p className="text-outline text-xs">Students' questions will appear here in real time</p>
                </div>
              ) : (
                doubts.map((doubt: any) => (
                  <div key={doubt._id} className="p-4 bg-surface_container_low rounded-2xl border border-outline_variant/10 group">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-xs font-black text-on_surface uppercase">
                          {doubt.studentId?.name || "Student"}
                        </span>
                        <span className="ml-2 text-[9px] font-bold text-outline bg-surface_container_high px-2 py-0.5 rounded-full">
                          {doubt.subject}
                        </span>
                      </div>
                      <span className="text-[10px] text-outline">
                        {new Date(doubt.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-on_surface_variant">{doubt.question}</p>
                  </div>
                ))
              )}
            </CardBody>
          </KnowledgeCard>
        </div>

        {/* ── Right: Student Roster ── */}
        <div className="col-span-4 space-y-6">
          <KnowledgeCard>
            <CardHeader className="flex justify-between items-center">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-outline" />
                Live Attendance
              </CardTitle>
              <span className="text-[10px] font-bold text-outline">{presentCount}/{students.length}</span>
            </CardHeader>
            <CardBody className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {students.length === 0 && (
                <p className="text-sm text-on_surface_variant text-center py-6">No students enrolled in this batch.</p>
              )}
              {students.map(s => {
                const status = attendanceMap[s.id];
                const isPresent = status === "present";
                return (
                  <div key={s.id} className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
                    isPresent
                      ? "bg-green-500/5 border-green-500/20"
                      : "bg-surface_container_low border-outline_variant/10"
                  }`}>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isPresent ? "bg-green-500" : "bg-outline/30"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-on_surface truncate">{s.name}</p>
                      <p className="text-[9px] text-outline truncate">{s.email}</p>
                    </div>
                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded flex-shrink-0 ${
                      isPresent ? "bg-green-500/20 text-green-600" : "bg-surface_container_high text-outline"
                    }`}>
                      {isPresent ? "In" : "Out"}
                    </span>
                  </div>
                );
              })}
            </CardBody>
            <div className="mt-4 pt-4 border-t border-outline_variant/10">
              <button className="w-full py-3 border-2 border-dashed border-outline_variant/20 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-outline hover:text-error hover:border-error/50 transition-all">
                <ShieldAlert className="w-4 h-4" /> SOS Admin Assistance
              </button>
            </div>
          </KnowledgeCard>
        </div>

      </div>

      {/* ── Auto-refresh note ── */}
      <p className="text-center text-[10px] text-outline">
        Data auto-refreshes every 30 seconds · Last updated {lastRefresh.toLocaleTimeString()}
      </p>
    </div>
  );
}

export default function MissionControlCenter() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>}>
      <ControlCenterContent />
    </Suspense>
  );
}
