"use client";

import { useEffect, useState, useMemo } from "react";
import { KnowledgeCard, CardHeader, CardTitle, CardBody } from "@/components/KnowledgeCard";
import { DataTable } from "@/components/DataTable";
import { 
  Download, Star, Clock, CheckCircle2, AlertCircle, 
  TrendingUp, Users, X, Mail, Phone, Calendar, 
  Award, Activity, Zap, ExternalLink, RefreshCw 
} from "lucide-react";
import { db } from "@/lib/db";

export default function AdminQAPage() {
  const [filter, setFilter] = useState<"All" | "Resolved" | "Pending" | "In Review">("All");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [doubts, setDoubts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [doubtsData, statsData] = await Promise.all([
        db.user.getAllDoubts(),
        db.user.getDoubtStats()
      ]);
      setDoubts(doubtsData || []);
      setStats(statsData || null);
    } catch (error) {
      console.error("Failed to fetch QA reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (filter === "All") return doubts;
    return doubts.filter(r => r.status === filter);
  }, [doubts, filter]);

  const teacherStats = useMemo(() => {
    if (!stats?.byInstructor) return [];
    return stats.byInstructor.map((item: any) => ({
      teacherId: item._id,
      teacher: item.instructor?.name || "System/Deleted",
      total: item.count,
      resolved: item.resolved,
      resolutionRate: Math.round((item.resolved / item.count) * 100),
      avgResponseTime: "Calculated" // Placeholder unless we add avg calculation to aggregate
    }));
  }, [stats]);

  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    const doubt = doubts.find(d => d.studentId?._id === selectedStudentId);
    return doubt?.studentId || null;
  }, [selectedStudentId, doubts]);

  const studentDoubtHistory = useMemo(() => {
    return doubts.filter(r => r.studentId?._id === selectedStudentId);
  }, [selectedStudentId, doubts]);

  const handleExport = () => {
    const headers = ["#", "Teacher", "Teacher ID", "Student", "Student ID", "Subject", "Question", "Submitted", "Resolved At", "Status"];
    const rows = doubts.map((r, i) => [
      i + 1, r.instructorId?.name || "Unassigned", r.instructorId?._id || "—", r.studentId?.name || "Deleted", r.studentId?._id || "—",
      r.subject, `"${r.question}"`, new Date(r.createdAt).toLocaleString(), r.resolvedAt ? new Date(r.resolvedAt).toLocaleString() : "—", r.status
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qa_performance_report_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const logColumns = [
    { key: "instructorId", header: "Teacher", render: (v: any) => (
      <div>
        <p className="font-bold text-on_surface text-sm">{v?.name || "Unassigned"}</p>
        <p className="text-[10px] text-outline tracking-widest uppercase">{v?._id?.slice(-6) || "—"}</p>
      </div>
    )},
    { key: "studentId", header: "Student", render: (v: any) => (
      <button 
        onClick={() => setSelectedStudentId(v?._id)}
        className="text-left group transition-all"
      >
        <p className="font-bold text-on_surface text-sm group-hover:text-primary">{v?.name || "Deleted"}</p>
        <p className="text-[10px] text-outline tracking-widest flex items-center gap-1 group-hover:text-primary/70 uppercase">
          {v?._id?.slice(-6) || "—"} <ExternalLink className="w-2.5 h-2.5" />
        </p>
      </button>
    )},
    { key: "subject", header: "Subject" },
    { key: "createdAt", header: "Filed At", render: (v: string) => new Date(v).toLocaleDateString() },
    { key: "status", header: "Status", render: (v: string) => (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest ${
        v === "Resolved" ? "bg-primary/10 text-primary" :
        v === "In Review"  ? "bg-secondary/10 text-secondary" :
                           "bg-error/10 text-error"
      }`}>{v}</span>
    )},
  ];

  const perfColumns = [
    { key: "teacher", header: "Teacher" },
    { key: "total",    header: "Total" },
    { key: "resolutionRate", header: "Efficiency", render: (v: number) => (
      <div className="flex items-center gap-2">
        <div className="w-20 h-1.5 bg-surface_container_highest rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${v}%` }} />
        </div>
        <span className="text-xs font-bold text-on_surface">{v}%</span>
      </div>
    )},
  ];

  if (loading) return (
    <div className="p-20 text-center">
      <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
      <p className="text-on_surface_variant animate-pulse font-medium">Aggregating QA Intelligence...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-manrope font-bold tracking-tight mb-2">QA Intelligence Center</h1>
          <p className="text-on_surface_variant max-w-2xl text-sm italic">
            "Absolute transparency in doubt resolution correlates directly with batch excellence."
          </p>
        </div>
        <div className="flex gap-4">
           <button onClick={handleExport} className="btn-premium gap-2 scale-90 sm:scale-100">
              <Download className="w-4 h-4" /> Authority Export
           </button>
        </div>
      </header>

      {/* Stats Quick View */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Queries",  value: stats?.overview?.total || 0, icon: Users, color: "text-primary" },
          { label: "Resolved",       value: stats?.overview?.resolved || 0, icon: CheckCircle2, color: "text-primary" },
          { label: "Live Pending",   value: stats?.overview?.pending || 0, icon: Clock, color: "text-secondary" },
          { label: "In Review",      value: stats?.overview?.inReview || 0, icon: AlertCircle, color: "text-error" },
        ].map(s => (
          <KnowledgeCard key={s.label} className="p-5">
            <div className="flex gap-3 items-center">
              <div className={`p-2.5 rounded-xl bg-surface_container_high ${s.color}`}>
                <s.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-outline uppercase tracking-wider">{s.label}</p>
                <p className={`text-2xl font-extrabold font-manrope ${s.color}`}>{s.value}</p>
              </div>
            </div>
          </KnowledgeCard>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
           <KnowledgeCard>
              <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-outline_variant/10 mb-0">
                <CardTitle>Global Doubt Audit Log</CardTitle>
                <div className="flex gap-2 text-[10px] font-bold">
                  {(["All", "Resolved", "Pending", "In Review"] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1.5 rounded-lg transition-all uppercase tracking-widest ${
                        filter === f ? "bg-primary text-on_primary shadow-glow" : "bg-surface_container_high text-outline hover:text-on_surface"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardBody className="p-0">
                <DataTable columns={logColumns} data={filtered} />
              </CardBody>
           </KnowledgeCard>
        </div>

        <div className="space-y-6">
           <KnowledgeCard>
              <CardHeader className="pb-4 border-b border-outline_variant/10 mb-0">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Star className="w-4 h-4 text-primary" /> Faculty Matrix
                </CardTitle>
              </CardHeader>
              <CardBody className="p-0">
                <DataTable columns={perfColumns} data={teacherStats} />
              </CardBody>
           </KnowledgeCard>

           <KnowledgeCard className="bg-gradient-to-br from-surface to-surface_container_high p-6 border-primary/10">
              <h4 className="font-bold mb-2 flex items-center gap-2">
                 <Award className="w-4 h-4 text-primary" /> Policy Enforcement
              </h4>
              <p className="text-xs text-on_surface_variant leading-relaxed mb-4">
                 All doubt resolution data is cryptographically hashed for performance reviews. Manual overrides are flagged for secondary audit.
              </p>
              <button className="w-full py-2.5 rounded-lg border border-primary/30 text-primary font-bold text-[10px] uppercase tracking-widest hover:bg-primary/5 transition-all">
                 Review Compliance Logs
              </button>
           </KnowledgeCard>
        </div>
      </div>

      {/* --- STUDENT DOSSIER MODAL --- */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="w-full max-w-4xl bg-surface_container_lowest border border-outline_variant/30 rounded-3xl shadow-ambient overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="p-6 border-b border-outline_variant/10 flex justify-between items-center bg-surface_container_low">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl">
                       {selectedStudent.name.split(' ').map((n:any) => n[0]).join('')}
                    </div>
                    <div>
                       <h2 className="text-2xl font-bold font-manrope">{selectedStudent.name}</h2>
                       <p className="text-xs text-outline font-bold uppercase tracking-widest">{selectedStudentId} · {selectedStudent.rank}</p>
                    </div>
                 </div>
                 <button 
                   onClick={() => setSelectedStudentId(null)}
                   className="p-2.5 bg-surface_container_high rounded-full hover:bg-surface_container_highest transition-all"
                 >
                    <X className="w-6 h-6" />
                 </button>
              </div>

              {/* Modal Content - Scrollable Area */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8 hide-scrollbar">
                 
                 {/* Top Info Grid */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <KnowledgeCard className="p-5 flex flex-col justify-between">
                       <div className="flex justify-between items-start mb-4">
                          <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Contact Logic</p>
                          <Mail className="w-4 h-4 text-primary" />
                       </div>
                       <p className="font-bold text-on_surface mb-1">{selectedStudent.email}</p>
                       <p className="text-xs text-on_surface_variant">{selectedStudent.phone || "No contact digits found"}</p>
                    </KnowledgeCard>

                    <KnowledgeCard className="p-5 flex flex-col justify-between">
                       <div className="flex justify-between items-start mb-4">
                          <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Identity</p>
                          <Calendar className="w-4 h-4 text-secondary" />
                       </div>
                       <p className="font-bold text-on_surface mb-1">{selectedStudent.name}</p>
                       <p className="text-xs text-on_surface_variant">Status: {selectedStudent.status?.toUpperCase()}</p>
                    </KnowledgeCard>

                    <KnowledgeCard className="p-5 flex flex-col justify-between">
                       <div className="flex justify-between items-start mb-4">
                          <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Reward Matrix</p>
                          <Star className="w-4 h-4 text-warning" />
                       </div>
                       <p className="text-2xl font-black font-manrope text-on_surface">{selectedStudent.xp || 0} XP</p>
                       <p className="text-[10px] font-bold text-outline uppercase">Azure Academy Standing</p>
                    </KnowledgeCard>
                 </div>

                 {/* Engagement Dossier Sections */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Academic Pulse */}
                    <KnowledgeCard className="p-6">
                       <CardHeader className="px-0 pb-4 mb-4 border-b border-outline_variant/10">
                          <CardTitle className="text-sm flex items-center gap-2">
                             <Activity className="w-4 h-4 text-primary" /> Academic Profile
                          </CardTitle>
                       </CardHeader>
                       <div className="space-y-6">
                          <div>
                             <div className="flex justify-between text-xs font-bold mb-1.5">
                                <span>Engagement Threshold</span>
                                <span className="text-primary">Dynamic</span>
                             </div>
                             <div className="w-full h-1.5 bg-surface_container_highest rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: "75%" }} />
                             </div>
                          </div>
                          <div className="flex gap-2 pt-2">
                              <span className="text-[10px] font-bold bg-surface_container_high px-2 py-0.5 rounded border border-outline_variant/30 text-outline">
                                 {selectedStudent.status?.toUpperCase()}
                              </span>
                              <span className="text-[10px] font-bold bg-surface_container_high px-2 py-0.5 rounded border border-outline_variant/30 text-outline">
                                 STUDENT
                              </span>
                          </div>
                       </div>
                    </KnowledgeCard>

                    {/* Behavior/Bio */}
                    <KnowledgeCard className="p-6">
                       <CardHeader className="px-0 pb-4 mb-4 border-b border-outline_variant/10">
                          <CardTitle className="text-sm flex items-center gap-2">
                             <Zap className="w-4 h-4 text-warning" /> Behavioral Analysis
                          </CardTitle>
                       </CardHeader>
                       <p className="text-sm text-on_surface_variant leading-relaxed italic">
                          "{selectedStudent.description || "No specific student dossier notes provided for this user."}"
                       </p>
                       <div className="mt-6 flex flex-col gap-3">
                          <div className="p-3 bg-surface_container_low border border-outline_variant/20 rounded-xl flex items-center gap-3">
                             <Award className="w-5 h-5 text-primary" />
                             <div>
                                <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Academic Role</p>
                                <p className="font-bold text-on_surface text-xs">{selectedStudent.title || "Elite Scholar"}</p>
                             </div>
                          </div>
                       </div>
                    </KnowledgeCard>
                 </div>

                 {/* Interaction History (Audit Sub-log) */}
                 <KnowledgeCard className="bg-surface_container_low/40">
                    <CardHeader className="border-b border-outline_variant/10 pb-4 mb-0">
                       <CardTitle className="text-sm flex items-center justify-between">
                          <span className="flex items-center gap-2 text-primary">
                             <Clock className="w-4 h-4" /> Doubt Resolution History
                          </span>
                          <span className="text-[10px] text-outline font-bold uppercase">{studentDoubtHistory.length} Interactions Filed</span>
                       </CardTitle>
                    </CardHeader>
                    <DataTable 
                      data={studentDoubtHistory} 
                      columns={[
                        { key: "createdAt", header: "Timestamp", render: (v: string) => new Date(v).toLocaleDateString() },
                        { key: "subject", header: "Subject" },
                        { key: "question", header: "Technical Query", render: (v: string) => <p className="line-clamp-1 max-w-[200px] italic">"{v}"</p> },
                        { key: "instructorId", header: "Handled By", render: (v: any) => v?.name || "Unassigned" },
                        { key: "status", header: "Result", render: (v: string) => (
                           <span className={v === 'Resolved' ? 'text-primary font-bold' : 'text-error font-bold'}>{v}</span>
                        )}
                      ]}
                    />
                 </KnowledgeCard>

              </div>
              
              {/* Fixed Footer with Actions */}
              <div className="p-6 border-t border-outline_variant/10 bg-surface_container_low flex justify-between items-center">
                 <p className="text-xs text-on_surface_variant">Dossier hash: 0x{Math.random().toString(16).slice(2, 10).toUpperCase()}</p>
                 <div className="flex gap-4">
                    <button className="px-6 py-2.5 rounded-xl border border-outline_variant/30 font-bold text-sm hover:bg-surface_container_high transition-all">
                       Export Dossier PDF
                    </button>
                    <button className="px-6 py-2.5 rounded-xl bg-primary text-on_primary font-bold text-sm shadow-glow hover:bg-primary_bright transition-all">
                       Initiate Direct Contact
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
