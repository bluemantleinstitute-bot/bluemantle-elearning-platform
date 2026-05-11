"use client";

import { useState, useEffect } from "react";
import { KnowledgeCard, CardHeader, CardTitle, CardBody } from "@/components/KnowledgeCard";
import { DataTable } from "@/components/DataTable";
import { ClipboardCheck, Search, Filter, Save, MoreVertical, Check, X, Loader2, RefreshCw } from "lucide-react";
import { db } from "@/lib/db";
import { apiRequest } from "@/lib/api";

export default function MarkAttendance() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const classesData = await db.user.getTeacherClasses();
      setClasses(classesData || []);
      if (classesData?.length > 0) {
        setSelectedClassId(classesData[0]._id);
      }
    } catch (error) {
      console.error("Failed to fetch classes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const fetchStudentsAndAttendance = async () => {
      if (!selectedClassId) return;
      try {
        setIsLoading(true);
        const selectedClass = classes.find(c => c._id === selectedClassId);
        if (!selectedClass) return;

        const batchId = selectedClass.batchId?._id || selectedClass.batchId;
        const [batchRes, attendanceRes] = await Promise.all([
          db.user.getBatchDetails(batchId),
          apiRequest(`/attendance/class/${selectedClassId}`)
        ]);

        if (batchRes) {
          setStudents(batchRes.students || []);
        }

        if (attendanceRes.success) {
          const map: Record<string, string> = {};
          (attendanceRes.data || []).forEach((rec: any) => {
            const sid = rec.studentId?._id || rec.studentId;
            map[sid] = rec.status;
          });
          setAttendanceRecords(map);
        } else {
          setAttendanceRecords({});
        }
      } catch (error) {
        console.error("Failed to fetch students:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentsAndAttendance();
  }, [selectedClassId, classes]);

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const markAllPresent = () => {
    const newRecords = { ...attendanceRecords };
    students.forEach(s => {
      newRecords[s._id] = "present";
    });
    setAttendanceRecords(newRecords);
  };

  const handleSync = async () => {
    if (!selectedClassId) return;
    try {
      setIsSyncing(true);
      const records = Object.entries(attendanceRecords).map(([studentId, status]) => ({
        studentId,
        status
      }));

      const res = await apiRequest("/attendance/mark", {
        method: "POST",
        body: JSON.stringify({
          classId: selectedClassId,
          records
        })
      });

      if (res.success) {
        setStatusMsg("Attendance synchronized successfully!");
        setTimeout(() => setStatusMsg(""), 3000);
      } else {
        alert(res.message || "Failed to sync attendance");
      }
    } catch (error) {
      alert("Error syncing attendance");
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.signInId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { 
      key: "name", 
      header: "Student Name",
      render: (val: string, row: any) => (
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-full bg-surface_container_high flex items-center justify-center font-bold text-xs text-primary">
              {val.charAt(0)}
           </div>
           <div>
              <p className="font-bold text-on_surface">{val}</p>
              <p className="text-[10px] text-outline font-bold uppercase tracking-widest">{row.signInId}</p>
           </div>
        </div>
      )
    },
    { 
      key: "status", 
      header: "Session Status",
      render: (_: string, row: any) => {
        const currentStatus = attendanceRecords[row._id] || "absent";
        return (
          <div className="flex gap-2">
             <button 
                onClick={() => handleStatusChange(row._id, "present")}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border transition-all ${currentStatus === 'present' ? 'bg-primary text-on_primary border-primary' : 'bg-surface_container_low border-outline_variant/30 text-outline'}`}
             >
                Present
             </button>
             <button 
                onClick={() => handleStatusChange(row._id, "absent")}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border transition-all ${currentStatus === 'absent' ? 'bg-error text-on_error border-error' : 'bg-surface_container_low border-outline_variant/30 text-outline'}`}
             >
                Absent
             </button>
             <button 
                onClick={() => handleStatusChange(row._id, "late")}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border transition-all ${currentStatus === 'late' ? 'bg-secondary text-on_secondary border-secondary' : 'bg-surface_container_low border-outline_variant/30 text-outline'}`}
             >
                Late
             </button>
          </div>
        );
      }
    }
  ];

  const stats = {
    present: Object.values(attendanceRecords).filter(v => v === "present").length,
    absent: students.length - Object.values(attendanceRecords).filter(v => v === "present").length,
  };

  if (isLoading && classes.length === 0) return (
    <div className="p-20 text-center">
      <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
      <p className="text-on_surface_variant animate-pulse font-medium">Accessing Attendance Protocols...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-manrope font-bold tracking-tight mb-2">Daily Attendance</h1>
          <p className="text-on_surface_variant">Log attendance for your live sessions. Data will be synced to the central student portal.</p>
        </div>
        <div className="flex gap-4">
           {statusMsg && (
             <div className="bg-secondary_container text-on_secondary_container px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-right-4">
                <Check className="w-4 h-4" /> {statusMsg}
             </div>
           )}
           <button 
            onClick={handleSync}
            disabled={isSyncing || !selectedClassId}
            className="bg-primary text-on_primary px-8 py-2.5 rounded-full font-bold shadow-ambient flex items-center gap-2 hover:scale-105 active:scale-95 transition-all text-sm disabled:opacity-50"
           >
             {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
             {isSyncing ? "Syncing..." : "Sync All Changes"}
           </button>
        </div>
      </header>

      {/* Selector Area */}
      <section className="p-6 rounded-3xl bg-surface_container_low border border-outline_variant/10 flex flex-wrap gap-6 items-end">
         <div className="space-y-2 flex-1 min-w-[200px]">
            <label className="text-[10px] font-bold uppercase tracking-widest text-outline">Select Live Session</label>
            <select 
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              className="w-full bg-surface_container_lowest border border-outline_variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-on_surface"
            >
               {classes.map(c => (
                 <option key={c._id} value={c._id}>{c.topic} ({c.batchId?.name || "Global"})</option>
               ))}
               {classes.length === 0 && <option value="">No classes found</option>}
            </select>
         </div>
         <div className="flex gap-4 w-full md:w-auto">
            <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
               <input 
                  type="text" 
                  placeholder="Search student..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-surface_container_lowest border border-outline_variant/30 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-on_surface" 
               />
            </div>
            <button className="p-3 bg-surface_container_lowest border border-outline_variant/30 rounded-xl hover:bg-surface_container_high transition-colors"><Filter className="w-5 h-5 text-outline" /></button>
         </div>
      </section>

      <KnowledgeCard>
         <CardHeader className="flex justify-between items-center border-b border-outline_variant/10 pb-6 mb-0">
            <CardTitle>Attendance Ledger</CardTitle>
            <div className="flex gap-4">
               <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-primary" /> Present: {stats.present}
               </div>
               <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-error" /> Not Present: {stats.absent}
               </div>
            </div>
         </CardHeader>
         <CardBody className="p-0">
            {isLoading ? (
               <div className="p-20 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary opacity-50" />
               </div>
            ) : (
               <DataTable columns={columns} data={filteredStudents} />
            )}
            <div className="p-8 flex justify-center border-t border-outline_variant/10">
               <p className="text-[10px] font-bold text-outline uppercase tracking-widest">
                  {students.length} Students in Cohort · {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
               </p>
            </div>
         </CardBody>
      </KnowledgeCard>

      {/* Quick Ops */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <button 
            onClick={markAllPresent}
            className="p-6 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between text-left hover:bg-primary/10 transition-colors group"
         >
            <div>
               <h4 className="font-bold text-primary">Mark All as Present</h4>
               <p className="text-xs text-on_surface_variant">Quickly log attendance for the entire cohort.</p>
            </div>
            <div className="p-3 bg-primary text-on_primary rounded-xl group-hover:scale-110 transition-transform"><Check className="w-5 h-5" /></div>
         </button>
         <div className="p-6 rounded-2xl bg-secondary/5 border border-secondary/10 flex items-center justify-between">
            <div>
               <h4 className="font-bold text-secondary">Automatic Sync</h4>
               <p className="text-xs text-on_surface_variant">Zoom attendance will automatically merge into this ledger.</p>
            </div>
            <div className="p-3 bg-secondary text-on_primary rounded-xl opacity-50"><RefreshCw className="w-5 h-5" /></div>
         </div>
      </div>
    </div>
  );
}


function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
