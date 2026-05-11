"use client";
import { useState, useEffect } from "react";
import { KnowledgeCard, CardHeader, CardTitle, CardBody } from "@/components/KnowledgeCard";
import { ClipboardCheck, TrendingUp, AlertTriangle, Star, Activity, MoreHorizontal, User } from "lucide-react";
import { apiRequest } from "@/lib/api";

export default function AttendanceMonitoring() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiRequest("/attendance/admin/stats");
        if (res.success) {
          setStats(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch admin attendance stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-20 text-center flex justify-center animate-pulse text-on_surface_variant">Loading Analytics...</div>;

  const classes = stats?.classes || [];
  const topStudent = stats?.topStudent;

  return (
    <div className="space-y-8 pb-16">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-manrope font-bold tracking-tight mb-2">Attendance Monitoring</h1>
          <p className="text-on_surface_variant">Real-time participation analytics across Azure Academy departments.</p>
        </div>
      </header>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KnowledgeCard className="p-8">
           <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-2">Average Attendance</p>
           <h3 className="text-4xl font-manrope font-bold mb-2">{stats?.avgAttendance || "0%"}</h3>
           <div className="flex items-center gap-2 text-primary text-xs font-bold">
              <TrendingUp className="w-4 h-4" /> Based on all records
           </div>
        </KnowledgeCard>

        <KnowledgeCard className="p-8 border-error/20 bg-error/5">
           <p className="text-[10px] font-bold text-error uppercase tracking-wider mb-2">At Risk</p>
           <h3 className="text-4xl font-manrope font-bold mb-2 text-error">{stats?.atRiskCount || 0} Students</h3>
           <p className="text-xs text-on_surface_variant font-medium">Below 75% engagement threshold</p>
        </KnowledgeCard>

        <KnowledgeCard className="p-8 border-secondary/20 bg-secondary/5">
           <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-2">Perfect Record</p>
           <h3 className="text-4xl font-manrope font-bold mb-2 text-secondary">{stats?.perfectCount || 0} Students</h3>
           <p className="text-xs text-on_surface_variant font-medium">100% attendance in current semester</p>
        </KnowledgeCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Participation heatmap / Charts would go here */}
        <div className="lg:col-span-2 space-y-6">
           <KnowledgeCard>
             <CardHeader className="flex justify-between items-center mb-4">
                <CardTitle>Class-wise Performance</CardTitle>
                <button className="p-2 hover:bg-surface_container_high rounded-lg transition-colors"><Activity className="w-5 h-5 text-outline" /></button>
             </CardHeader>
             <CardBody className="space-y-4">
                {classes.length === 0 && <p className="text-sm text-on_surface_variant text-center py-4">No class attendance data available.</p>}
                {classes.map((cls: any, i: number) => (
                  <div key={i} className="p-5 rounded-2xl bg-surface_container_low border border-outline_variant/10 hover:border-primary/20 transition-all flex justify-between items-center group">
                    <div className="flex gap-4 items-center">
                       <div className={`p-3 rounded-xl ${cls.status === 'Excellent' ? 'bg-primary/10 text-primary' : cls.status === 'Warning' ? 'bg-error/10 text-error' : 'bg-secondary/10 text-secondary'}`}>
                          <ClipboardCheck className="w-6 h-6" />
                       </div>
                       <div>
                          <h4 className="font-bold text-on_surface">{cls.title}</h4>
                          <p className="text-xs text-on_surface_variant mt-0.5">{cls.instructor} • {cls.session}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className={`text-2xl font-bold font-manrope ${cls.status === 'Warning' ? 'text-error' : 'text-on_surface'}`}>{cls.attendance}</p>
                       <span className={`text-[10px] font-bold uppercase tracking-widest ${cls.status === 'Excellent' ? 'text-primary' : cls.status === 'Warning' ? 'text-error' : 'text-secondary'}`}>
                          {cls.status}
                       </span>
                    </div>
                  </div>
                ))}
             </CardBody>
           </KnowledgeCard>

           <section className="p-8 rounded-3xl bg-surface_container_low border border-outline_variant/20 flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1">
                 <h3 className="text-lg font-manrope font-bold mb-2">Department Participation Heatmap</h3>
                 <p className="text-sm text-on_surface_variant">Visualizing engagement density across all 14 departments. Most active: Quantum Sciences.</p>
              </div>
              <div className="w-full md:w-48 h-24 bg-surface_container_highest rounded-xl flex items-center justify-center border border-outline_variant/30">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-outline">Map Placeholder</span>
              </div>
           </section>
        </div>

        {/* Student Spotlight */}
        <div className="space-y-6">
           <KnowledgeCard className="bg-signature-gradient text-on_primary border-none overflow-hidden relative">
              <div className="absolute top-0 right-0 w-40 h-40 bg-on_primary/10 rounded-full -mr-20 -mt-20 blur-3xl" />
              <CardHeader>
                 <CardTitle className="text-on_primary flex items-center gap-2">
                    <Star className="w-5 h-5 text-secondary_fixed" /> Student Spotlight
                 </CardTitle>
              </CardHeader>
              <CardBody className="p-8 pt-0 relative z-10">
                 {topStudent ? (
                   <>
                     <div className="flex gap-4 items-center mb-6">
                        <div className="w-16 h-16 rounded-full bg-surface/20 flex items-center justify-center font-bold text-2xl border border-on_primary/20 shadow-sm uppercase">
                           {topStudent.name?.split(" ").map((n: string) => n[0]).join("").substring(0, 2) || "ST"}
                        </div>
                        <div>
                           <h4 className="font-bold text-lg leading-tight">{topStudent.name}</h4>
                           <p className="text-xs text-on_primary_container opacity-80">ID: {topStudent.id}</p>
                        </div>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-on_primary/10 p-4 rounded-2xl border border-on_primary/20 text-center">
                           <p className="text-2xl font-bold mb-1">{topStudent.percentage}</p>
                           <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Overall</p>
                        </div>
                        <div className="bg-on_primary/10 p-4 rounded-2xl border border-on_primary/20 text-center">
                           <p className="text-2xl font-bold mb-1">100%</p>
                           <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">This Week</p>
                        </div>
                     </div>

                     <div className="space-y-3">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-widest opacity-70">
                           <span>Current Term Activity</span>
                           <span>Excellent</span>
                        </div>
                        <div className="h-1.5 bg-on_primary/20 rounded-full overflow-hidden">
                           <div className="h-full bg-secondary_fixed" style={{ width: '92%' }} />
                        </div>
                     </div>
                   </>
                 ) : (
                   <p className="text-sm opacity-80">No attendance data available for spotlight yet.</p>
                 )}
              </CardBody>
           </KnowledgeCard>

           <KnowledgeCard className="p-6">
              <CardTitle className="text-base mb-4 flex items-center gap-2">
                 <TrendingUp className="w-4 h-4 text-primary" /> Participation Curve
              </CardTitle>
              <div className="w-full h-32 bg-surface_container_low rounded-xl border border-outline_variant/20 flex items-center justify-center">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-outline">Curve Data Graph</span>
              </div>
           </KnowledgeCard>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
