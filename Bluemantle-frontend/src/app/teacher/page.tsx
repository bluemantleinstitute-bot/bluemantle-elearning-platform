"use client";

import { useEffect, useState } from "react";
import { KnowledgeCard, CardHeader, CardTitle, CardBody } from "@/components/KnowledgeCard";
import { Users, Calendar, TrendingUp, Clock, BookOpen, Upload, Bell, ArrowRight, X, Video, FileText, RefreshCw, AlertCircle } from "lucide-react";
import { db } from "@/lib/db";
import { apiRequest } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function TeacherDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadType, setUploadType] = useState<"video" | "note">("video");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [modules, setModules] = useState<any[]>([]);
  const [fetchingModules, setFetchingModules] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    title: "",
    youtubeId: "",
    duration: "",
    fileUrl: "",
    description: "",
    order: 1
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const dashboardData = await db.user.getTeacherData();
      console.log("Teacher Dashboard Data:", dashboardData);
      setData(dashboardData);
    } catch (error) {
      console.error("Failed to fetch teacher data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      const fetchModules = async () => {
        try {
          setFetchingModules(true);
          const courseData = await db.user.getAdminCourseDetails(selectedCourse);
          console.log("Fetched Course Modules:", courseData.modules);
          setModules(courseData.modules || []);
          if (courseData.modules?.length > 0) {
            setSelectedModule(courseData.modules[0]._id);
          }
        } catch (error) {
          console.error("Failed to fetch modules:", error);
        } finally {
          setFetchingModules(false);
        }
      };
      fetchModules();
    }
  }, [selectedCourse]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !selectedModule || !formData.title) return;

    try {
      setUploading(true);
      let endpoint = uploadType === "video" ? "/videos" : "/notes";
      const payload = uploadType === "video" ? {
        title: formData.title,
        youtubeId: formData.youtubeId,
        courseId: selectedCourse,
        moduleId: selectedModule,
        order: Number(formData.order),
        duration: formData.duration || "00:00",
        description: formData.description
      } : {
        title: formData.title,
        fileUrl: formData.fileUrl,
        courseId: selectedCourse,
        moduleId: selectedModule,
        order: Number(formData.order),
        description: formData.description
      };

      const res = await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      if (res.success) {
        setIsUploadModalOpen(false);
        alert(`${uploadType === "video" ? "Video" : "Note"} uploaded successfully!`);
        // Reset form
        setFormData({ title: "", youtubeId: "", duration: "", fileUrl: "", description: "", order: 1 });
      } else {
        alert(res.message || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("An error occurred during upload");
    } finally {
      setUploading(false);
    }
  };

  const handleIgnite = async (classId: string, batchId: string) => {
    try {
      // Set status to live immediately
      await apiRequest(`/classes/${classId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: "live" })
      });

      // Open zoom meeting in new tab
      window.open(`/teacher/live/${classId}/zoom`, '_blank');
      
      // Navigate to control center
      router.push(`/teacher/live/control-center?classId=${classId}&batchId=${batchId}`);
    } catch (err) {
      console.error("Failed to ignite session:", err);
      // Fallback: still try to navigate
      router.push(`/teacher/live/control-center?classId=${classId}&batchId=${batchId}`);
    }
  };

  const handleReignite = async (classId: string) => {
    if (!confirm("This will revert the session status to LIVE and allow students to re-enter. Proceed?")) return;
    try {
      setLoading(true);
      const res = await db.user.reigniteLiveClass(classId);
      if (res.success) {
        alert("Session Re-ignited! You can now launch it again.");
        await fetchData();
      } else {
        alert(res.message || "Failed to re-ignite");
      }
    } catch (err) {
      alert("Error re-igniting session");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return <div className="p-20 text-center animate-pulse text-on_surface_variant">Syncing with Faculty Terminal...</div>;
  }

  const todayLectures = data.todayClasses;
  const upcomingSessions = data.upcomingSessions;

  return (
    <div className="space-y-8 pb-16">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-manrope font-bold tracking-tight mb-2">Academic Atelier</h1>
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
             <p className="text-on_surface_variant font-medium">
               {data.profile.name} • {data.profile.role}
             </p>
          </div>
        </div>
        <button className="p-3 bg-surface_container_low rounded-full relative hover:bg-surface_container_high transition-colors">
          <Bell className="w-5 h-5 text-on_surface_variant" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-surface" />
        </button>
      </header>

      {/* KPI Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KnowledgeCard className="p-6">
           <div className="flex gap-4 items-center">
              <div className="p-3 rounded-xl bg-surface_container_high text-primary">
                <Users className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Total Students</p>
                  <h3 className="text-2xl font-bold font-manrope">{data.studentCount}</h3>
              </div>
           </div>
        </KnowledgeCard>

        <KnowledgeCard className="p-6">
           <div className="flex gap-4 items-center">
              <div className="p-3 rounded-xl bg-surface_container_high text-secondary">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Classes Handled</p>
                  <h3 className="text-2xl font-bold font-manrope">{data.attendanceSummary.totalClassesHandled}</h3>
              </div>
           </div>
        </KnowledgeCard>

        <KnowledgeCard className="p-6">
           <div className="flex gap-4 items-center">
              <div className="p-3 rounded-xl bg-surface_container_high text-primary">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Avg Attendance</p>
                 <div className="flex items-center gap-2">
                     <h3 className="text-2xl font-bold font-manrope">{data.attendanceSummary.averageAttendancePercentage}%</h3>
                     <span className="text-[10px] font-bold text-primary">Avg</span>
                 </div>
              </div>
           </div>
        </KnowledgeCard>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Lectures */}
        <div className="lg:col-span-2 space-y-6">
           <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold font-manrope text-on_surface">Today&apos;s Lectures</h2>
              <button className="text-sm font-bold text-primary flex items-center gap-1 hover:underline">View Schedule <ArrowRight className="w-4 h-4" /></button>
           </div>
           <div className="space-y-4">
              {todayLectures.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-outline_variant/20 rounded-3xl text-on_surface_variant">
                   No sessions scheduled for today.
                </div>
              ) : (
                todayLectures.map((lecture: any, i: number) => (
                  <div key={i} className="flex gap-6 p-6 bg-surface_container_low border border-outline_variant/10 rounded-3xl hover:border-primary/20 transition-all group cursor-pointer shadow-ambient">
                    <div className="text-center min-w-[60px]">
                        <p className="text-lg font-bold font-manrope text-on_surface leading-none">{lecture.time.split(' ')[0]}</p>
                        <p className="text-[10px] font-bold text-outline uppercase tracking-widest mt-1">{lecture.time.split(' ')[1]}</p>
                    </div>
                    <div className="flex-1 border-l border-outline_variant/20 pl-6">
                        <h3 className="font-bold text-on_surface group-hover:text-primary transition-colors">{lecture.title}</h3>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-on_surface_variant flex items-center gap-1.5 font-medium">
                              <Clock className="w-3.5 h-3.5" /> {lecture.location}
                          </span>
                          <span className="text-xs text-on_surface_variant flex items-center gap-1.5 font-medium">
                              <Users className="w-3.5 h-3.5" /> {lecture.students}
                          </span>
                        </div>
                    </div>
                    <div className="flex items-center">
                        {lecture.status === 'finished' ? (
                          <button 
                            onClick={() => handleReignite(lecture._id)}
                            className="bg-secondary_container px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest text-secondary hover:bg-secondary hover:text-on_secondary transition-all flex items-center gap-2"
                          >
                            Resume Session <RefreshCw className="w-4 h-4" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleIgnite(lecture._id, lecture.batchId?._id || lecture.batchId)}
                            className="bg-surface_container_high px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest text-primary hover:bg-primary hover:text-on_primary transition-all flex items-center gap-2"
                          >
                            Ignite <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                    </div>
                  </div>
                ))
              )}
           </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
           <KnowledgeCard className="bg-signature-gradient text-on_primary border-none shadow-ambient p-8">
              <div className="w-12 h-12 rounded-2xl bg-on_primary/10 flex items-center justify-center mb-6">
                 <Upload className="w-6 h-6 text-on_primary" />
              </div>
              <h3 className="font-manrope font-bold text-lg mb-2">Upload Course Materials</h3>
              <p className="text-sm text-on_primary_container opacity-90 leading-relaxed mb-6">
                 Update your lectures with the latest research papers and videos for your assigned courses.
              </p>
              <button 
                onClick={() => setIsUploadModalOpen(true)}
                className="w-full bg-surface text-primary py-3 rounded-full font-bold text-sm hover:scale-[1.02] transition-transform"
              >
                 Upload New Resource
              </button>
           </KnowledgeCard>

           <KnowledgeCard>
              <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-secondary" /> Upcoming Sessions
                 </CardTitle>
              </CardHeader>
              <CardBody className="space-y-6">
                 {upcomingSessions.length === 0 ? (
                    <p className="text-xs text-on_surface_variant text-center py-4">No upcoming sessions found.</p>
                 ) : (
                    upcomingSessions.map((session: any, i: number) => (
                      <div key={i} className="relative pl-4 border-l-2 border-outline_variant/30 hover:border-secondary transition-colors cursor-default py-1">
                          <p className="text-[10px] font-bold text-outline uppercase tracking-widest">{session.date}</p>
                          <h4 className="font-bold text-sm text-on_surface mt-1">{session.title}</h4>
                          <p className="text-xs text-on_surface_variant">{session.location}</p>
                      </div>
                    ))
                 )}
              </CardBody>
           </KnowledgeCard>
        </div>
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-surface_container_lowest w-full max-w-xl rounded-3xl shadow-ambient border border-outline_variant/20 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-8 border-b border-outline_variant/10">
              <h2 className="text-2xl font-bold text-on_surface font-manrope">Provision Resource</h2>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-on_surface_variant hover:text-on_surface p-2 rounded-full hover:bg-surface_container_high transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpload} className="p-8 space-y-6">
              {/* Type Switcher */}
              <div className="flex bg-surface_container_high p-1 rounded-2xl">
                 <button 
                  type="button"
                  onClick={() => setUploadType("video")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${uploadType === "video" ? "bg-primary text-on_primary shadow-sm" : "text-on_surface_variant hover:text-on_surface"}`}
                 >
                    <Video className="w-4 h-4" /> Video Lecture
                 </button>
                 <button 
                  type="button"
                  onClick={() => setUploadType("note")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${uploadType === "note" ? "bg-primary text-on_primary shadow-sm" : "text-on_surface_variant hover:text-on_surface"}`}
                 >
                    <FileText className="w-4 h-4" /> Course Note
                 </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Target Course *</label>
                  <select 
                    required
                    id="course-select"
                    value={selectedCourse}
                    onChange={(e) => {
                      console.log("Course Selected:", e.target.value);
                      setSelectedCourse(e.target.value);
                      setSelectedModule("");
                    }}
                    className="w-full bg-surface_container_high border border-outline_variant/30 rounded-xl px-4 py-3 text-sm text-on_surface focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value="">-- Choose Course --</option>
                    {(data.assignedCourses || []).map((c: any) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                  {data.assignedCourses?.length === 0 && (
                    <p className="text-[10px] text-error mt-1 font-bold">No courses assigned to you.</p>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Module Section *</label>
                  <select 
                    required
                    id="module-select"
                    disabled={!selectedCourse || fetchingModules}
                    value={selectedModule}
                    onChange={(e) => {
                      console.log("Module Selected:", e.target.value);
                      setSelectedModule(e.target.value);
                    }}
                    className="w-full bg-surface_container_high border border-outline_variant/30 rounded-xl px-4 py-3 text-sm text-on_surface focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-50"
                  >
                    <option value="">{fetchingModules ? "Syncing..." : "-- Choose Module --"}</option>
                    {(modules || []).map((m: any) => (
                      <option key={m._id} value={m._id}>{m.title}</option>
                    ))}
                  </select>
                  {selectedCourse && !fetchingModules && modules.length === 0 && (
                    <p className="text-[10px] text-error mt-1 font-bold">No modules found in this course.</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Resource Title *</label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g. Introduction to Quantum Chromodynamics"
                  className="w-full bg-surface_container_low border border-outline_variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-on_surface"
                />
              </div>

              {uploadType === "video" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-2">YouTube Video ID *</label>
                    <input
                      required
                      type="text"
                      value={formData.youtubeId}
                      onChange={(e) => setFormData({...formData, youtubeId: e.target.value})}
                      placeholder="e.g. dQw4w9WgXcQ"
                      className="w-full bg-surface_container_low border border-outline_variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-on_surface"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Duration (Min) *</label>
                    <input
                      required
                      type="text"
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: e.target.value})}
                      placeholder="e.g. 45:00"
                      className="w-full bg-surface_container_low border border-outline_variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-on_surface"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Document File URL *</label>
                  <input
                    required
                    type="url"
                    value={formData.fileUrl}
                    onChange={(e) => setFormData({...formData, fileUrl: e.target.value})}
                    placeholder="e.g. https://storage.google.com/bluemantle/notes/quantum.pdf"
                    className="w-full bg-surface_container_low border border-outline_variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-on_surface"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-3">
                  <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Brief Abstract</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Short summary for the curriculum index..."
                    className="w-full bg-surface_container_low border border-outline_variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-on_surface"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Order *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={formData.order}
                    onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 1})}
                    className="w-full bg-surface_container_low border border-outline_variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-on_surface"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsUploadModalOpen(false)}
                  className="flex-1 py-4 rounded-2xl font-bold text-sm text-on_surface_variant hover:bg-surface_container_high transition-colors"
                >
                  Discard
                </button>
                <button 
                  type="submit" 
                  disabled={uploading}
                  className="flex-1 bg-primary text-on_primary py-4 rounded-2xl font-bold text-sm shadow-ambient hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Finalize Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
