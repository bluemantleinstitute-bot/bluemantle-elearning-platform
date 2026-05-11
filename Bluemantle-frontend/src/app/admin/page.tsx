"use client";

import { useEffect, useState } from "react";
import { KnowledgeCard, CardHeader, CardTitle, CardBody } from "@/components/KnowledgeCard";
import { Users, BookOpen, Video, Activity, GraduationCap, LayoutDashboard, Settings } from "lucide-react";
import { db } from "@/lib/db";

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dashboardData = await db.user.getAdminDashboard();
        setData(dashboardData);
      } catch (error) {
        console.error("Failed to fetch admin dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-20 text-center animate-pulse text-on_surface_variant">Initializing Terminal...</div>;

  const stats = data?.stats || { totalStudents: 0, totalCourses: 0, activeLiveClasses: 0, engagementRate: "0%" };
  const faculty = data?.faculty || [];
  const liveSessions = data?.liveSessions || [];

  return (
    <div className="space-y-10 pb-16 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-manrope font-bold tracking-tight mb-2">Academic Atelier</h1>
          <p className="text-on_surface_variant">Administrative Terminal</p>
        </div>
        <div className="flex gap-4">
          <button className="p-3 rounded-full bg-surface_container_high text-on_surface hover:bg-surface_container_highest transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>
      
      <section>
        <h2 className="text-xl font-bold font-manrope mb-6 text-on_surface">System Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <KnowledgeCard className="p-8">
            <div className="flex justify-between items-start mb-4">
              <div className="p-4 rounded-2xl bg-primary/10 text-primary">
                <Users className="w-8 h-8" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-outline px-3 py-1 bg-surface_container_high rounded-full">Real-time</span>
            </div>
            <h3 className="text-4xl font-manrope font-bold mb-1">{stats.totalStudents.toLocaleString()}</h3>
            <p className="text-sm font-semibold text-on_surface_variant">Total Enrollment</p>
            <p className="text-xs text-outline mt-4">Active student accounts verified across the cluster</p>
          </KnowledgeCard>

          <KnowledgeCard className="p-8">
            <div className="flex justify-between items-start mb-4">
              <div className="p-4 rounded-2xl bg-secondary/10 text-secondary">
                <BookOpen className="w-8 h-8" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-outline px-3 py-1 bg-surface_container_high rounded-full">Curriculum</span>
            </div>
            <h3 className="text-4xl font-manrope font-bold mb-1">{stats.totalCourses}</h3>
            <p className="text-sm font-semibold text-on_surface_variant">Live Courses</p>
            <p className="text-xs text-outline mt-4">Educational pathways currently published and active</p>
          </KnowledgeCard>

          <KnowledgeCard className="p-8">
            <div className="flex justify-between items-start mb-4">
              <div className="p-4 rounded-2xl bg-primary_fixed_variant/10 text-primary_fixed_variant">
                <Video className="w-8 h-8" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-outline px-3 py-1 bg-surface_container_high rounded-full">Connectivity</span>
            </div>
            <h3 className="text-4xl font-manrope font-bold mb-1">{stats.activeLiveClasses}</h3>
            <p className="text-sm font-semibold text-on_surface_variant">Active Classes</p>
            <p className="text-xs text-outline mt-4">Current live sessions operating across all batches</p>
          </KnowledgeCard>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <KnowledgeCard>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Faculty Management</CardTitle>
              <GraduationCap className="w-5 h-5 text-outline" />
            </div>
            <p className="text-xs text-on_surface_variant mt-1">Manage professor credentials and assignment status</p>
          </CardHeader>
          <CardBody className="space-y-4">
            {faculty.length === 0 ? (
              <p className="text-center py-8 text-xs text-outline italic">No faculty accounts found in this cluster.</p>
            ) : (
              faculty.map((f: any) => (
                <div key={f.email} className="flex justify-between items-center p-4 rounded-xl bg-surface_container_low border border-transparent hover:border-outline_variant/30 transition-all">
                  <div>
                    <h4 className="font-bold text-sm text-on_surface">{f.name}</h4>
                    <p className="text-xs text-on_surface_variant">{f.email}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full ${f.status === 'Active' ? 'bg-primary/10 text-primary' : 'bg-surface_container_highest text-outline'}`}>
                    {f.status}
                  </span>
                </div>
              ))
            )}
          </CardBody>
        </KnowledgeCard>

        <KnowledgeCard>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Live Controls</CardTitle>
              <Activity className="w-5 h-5 text-secondary" />
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            {liveSessions.length === 0 ? (
               <div className="p-8 text-center bg-surface_container_high/20 rounded-2xl">
                 <p className="text-xs text-outline italic">No upcoming live sessions detected.</p>
               </div>
            ) : (
              liveSessions.map((session: any) => (
                <div key={session.title} className="flex justify-between items-center p-4 rounded-xl bg-surface_container_low group cursor-pointer hover:bg-surface_container_high transition-all">
                  <div className="flex gap-4 items-center">
                    <div className={`w-2 h-2 rounded-full ${session.status === 'Live' ? 'bg-error animate-pulse' : 'bg-outline_variant'}`} />
                    <div>
                      <h4 className="font-bold text-sm text-on_surface">{session.title}</h4>
                      <p className="text-xs text-on_surface_variant">{session.details}</p>
                    </div>
                  </div>
                  <button className="text-[10px] font-bold uppercase text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Monitor
                  </button>
                </div>
              ))
            )}
          </CardBody>
        </KnowledgeCard>
      </div>

      <section className="p-8 rounded-3xl bg-surface_container text-on_surface border border-outline_variant/10">
        <div className="flex gap-6 items-center">
          <div className="p-4 rounded-2xl bg-surface_container_lowest">
            <LayoutDashboard className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-manrope font-bold text-lg">Core Infrastructure</h3>
            <p className="text-on_surface_variant text-sm mt-1">All systems operational. Network latency at optimal 12ms.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
