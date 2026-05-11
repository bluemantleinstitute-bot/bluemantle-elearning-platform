"use client";

import { useState, useEffect, useMemo } from "react";
import { KnowledgeCard, CardHeader, CardTitle, CardBody } from "@/components/KnowledgeCard";
import { DataTable } from "@/components/DataTable";
import { PremiumSearch } from "@/components/PremiumSearch";
import { Users, Activity, Layers, TrendingUp, MoreVertical, ExternalLink, CheckCircle2, Lock, RefreshCw, Loader2 } from "lucide-react";
import { db } from "@/lib/db";

export default function TeacherStudents() {
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingBatch, setLoadingBatch] = useState(false);

  useEffect(() => {
    const fetchTeacherBatches = async () => {
      try {
        setLoading(true);
        const data = await db.user.getTeacherData();
        setBatches(data.assignedBatches || []);
      } catch (error) {
        console.error("Failed to fetch teacher batches:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTeacherBatches();
  }, []);

  useEffect(() => {
    if (!selectedBatchId) {
      setStudents([]);
      return;
    }

    const fetchBatchStudents = async () => {
      try {
        setLoadingBatch(true);
        const res = await db.user.getBatchDetails(selectedBatchId);
        if (res) {
          setStudents(res.students || []);
        }
      } catch (error) {
        console.error("Failed to fetch batch students:", error);
      } finally {
        setLoadingBatch(false);
      }
    };

    fetchBatchStudents();
  }, [selectedBatchId]);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.signInId?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [students, searchQuery]);

  const activeBatch = batches.find(b => b._id === selectedBatchId);

  const columns = [
    {
      key: "signInId",
      header: "ID",
      render: (val: string) => (
        <span className="text-[10px] font-bold text-primary bg-primary/5 border border-primary/10 px-2 py-1 rounded tracking-widest uppercase whitespace-nowrap">
          {val}
        </span>
      )
    },
    {
      key: "name",
      header: "Student",
      render: (val: string, row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-surface_container_high flex items-center justify-center font-bold text-sm text-primary">
            {val.split(' ').map((n: string) => n[0]).join('')}
          </div>
          <div>
            <p className="font-bold text-on_surface">{val}</p>
            <p className="text-[10px] text-outline uppercase tracking-widest">{row.email}</p>
          </div>
        </div>
      )
    },
    { 
      key: "createdAt", 
      header: "Enrolled",
      render: (val: string) => new Date(val).toLocaleDateString()
    },
    {
      key: "progress",
      header: "Engagement",
      render: (_: any, row: any) => {
        // Mock progress for now as engagement metric
        const val = "75%"; 
        return (
          <div className="flex items-center gap-3 w-28">
            <div className="flex-1 h-1 bg-surface_container_highest rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: val }} />
            </div>
            <span className="text-[10px] font-bold text-on_surface">{val}</span>
          </div>
        );
      }
    },
    {
      key: "status",
      header: "Status",
      render: () => <span className="text-[10px] font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded uppercase">Verified</span>
    }
  ];

  if (loading) return (
    <div className="p-20 text-center">
      <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
      <p className="text-on_surface_variant animate-pulse font-medium">Initializing Student Protocols...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-manrope font-bold tracking-tight mb-2">Student Terminal</h1>
          <p className="text-on_surface_variant max-w-2xl">
            {activeBatch
              ? `Showing all students enrolled in "${activeBatch.name}" — ${activeBatch._id}`
              : "Select an assigned cohort to initialize the student roster."}
          </p>
        </div>
        {selectedBatchId && (
          <button onClick={() => { setSelectedBatchId(null); setSearchQuery(""); }} className="text-xs font-bold text-outline hover:text-primary transition-colors border border-outline_variant/30 px-4 py-2 rounded-full">
            ← All Cohorts
          </button>
        )}
      </header>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: students.length.toString(), icon: Users },
          { label: "Cohort View", value: filteredStudents.length > 0 ? filteredStudents.length.toString() : "—", icon: Activity },
          { label: "Batches Assigned", value: batches.length.toString(), icon: Layers },
          { label: "Avg. Engagement", value: "88.5%", icon: TrendingUp },
        ].map((stat) => (
          <KnowledgeCard key={stat.label} className="p-5">
            <div className="flex gap-3 items-center">
              <div className="p-2.5 rounded-xl bg-surface_container_high text-primary">
                <stat.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-outline uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-xl font-bold font-manrope">{stat.value}</h3>
              </div>
            </div>
          </KnowledgeCard>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Main Panel */}
        <div className="lg:col-span-2">
          {!selectedBatchId ? (
            /* ── Locked State ── */
            <div className="flex flex-col items-center justify-center h-[420px] text-center p-12 border border-dashed border-outline_variant/20 rounded-3xl bg-surface_container_low/50 animate-in fade-in duration-500">
              <div className="w-20 h-20 rounded-3xl bg-surface_container_highest flex items-center justify-center mb-6 text-outline">
                <Lock className="w-9 h-9" />
              </div>
              <h3 className="text-xl font-bold font-manrope text-on_surface mb-3">Terminal Locked</h3>
              <p className="text-sm text-on_surface_variant max-w-xs leading-relaxed">
                Select one of your assigned cohorts on the right to initialize the student roster and tracking system.
              </p>
            </div>
          ) : loadingBatch ? (
            <div className="flex flex-col items-center justify-center h-[420px] border border-outline_variant/20 rounded-3xl bg-surface_container_low/50">
               <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
            </div>
          ) : (
            /* ── Active State ── */
            <KnowledgeCard className="animate-in fade-in slide-in-from-bottom-4 duration-400">
              <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline_variant/10 pb-6 mb-0">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  {activeBatch?.name}
                  <span className="text-[10px] font-bold text-outline ml-1 tracking-widest uppercase">{activeBatch?._id.slice(-6)}</span>
                </CardTitle>
                <div className="w-full sm:w-auto">
                  <PremiumSearch
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search by name or ID..."
                  />
                </div>
              </CardHeader>
              <CardBody className="p-0">
                <DataTable columns={columns} data={filteredStudents} />
                <div className="p-6 flex justify-center border-t border-outline_variant/10">
                  <p className="text-[10px] font-bold text-outline uppercase tracking-[0.2em]">
                    {filteredStudents.length} records in cohort
                  </p>
                </div>
              </CardBody>
            </KnowledgeCard>
          )}
        </div>

        {/* Cohort Selector */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold font-manrope text-outline uppercase tracking-widest px-2">Assigned Cohorts</h3>
          {batches.map((batch) => (
            <KnowledgeCard
              key={batch._id}
              onClick={() => { setSelectedBatchId(batch._id); setSearchQuery(""); }}
              className={`p-6 transition-all cursor-pointer group relative overflow-hidden ${
                selectedBatchId === batch._id
                  ? 'border-primary ring-1 ring-primary/20 shadow-ambient bg-surface_container_high'
                  : 'hover:border-primary/30 hover:bg-surface_container_low'
              }`}
            >
              {selectedBatchId === batch._id && (
                <div className="absolute top-0 right-0 px-2 py-1 bg-primary text-on_primary rounded-bl-xl">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              )}
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className={`font-bold text-sm transition-colors ${selectedBatchId === batch._id ? 'text-primary' : 'text-on_surface group-hover:text-primary'}`}>
                    {batch.name}
                  </h4>
                  <p className="text-[10px] text-outline font-bold tracking-widest mt-1 uppercase">{batch._id.slice(-6)}</p>
                </div>
                <ExternalLink className={`w-4 h-4 flex-shrink-0 ml-2 transition-colors ${selectedBatchId === batch._id ? 'text-primary' : 'text-outline group-hover:text-primary'}`} />
              </div>
              <div className="flex items-center gap-2 mt-4 text-[10px] font-bold text-on_surface_variant">
                <Users className="w-3.5 h-3.5 text-primary" />
                Capacity: {batch.maxStudents} · Course: {batch.courseId?.title || "N/A"}
              </div>
            </KnowledgeCard>
          ))}

          {batches.length === 0 && (
            <p className="text-xs text-on_surface_variant italic text-center py-8">No assigned batches found.</p>
          )}

          <KnowledgeCard className="p-6 mt-2 border-primary/10 bg-surface_container_low text-center">
            <h4 className="font-bold text-sm mb-2">Cohort Intelligence</h4>
            <p className="text-xs text-on_surface_variant leading-relaxed mb-4">
              Select a batch to unlock grade distribution and individual export capabilities.
            </p>
            <button className="btn-premium w-full text-xs py-2.5">Generate Master Report</button>
          </KnowledgeCard>
        </div>
      </div>
    </div>
  );
}

