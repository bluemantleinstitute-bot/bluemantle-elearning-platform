"use client";

import { useState, useEffect } from "react";
import { KnowledgeCard, CardHeader, CardTitle, CardBody } from "@/components/KnowledgeCard";
import { PlayCircle, Plus, HardDrive, Video, Calendar, Clock, CloudUpload, MoreHorizontal, Loader2, X, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/api";
import dynamic from "next/dynamic";

const PremiumVideoPlayer = dynamic(
  () => import("@/components/PremiumVideoPlayer").then(mod => mod.PremiumVideoPlayer),
  { ssr: false, loading: () => <div className="aspect-video bg-black rounded-2xl animate-pulse" /> }
);

interface Course {
  _id: string;
  title: string;
}

interface Module {
  _id: string;
  title: string;
}

interface Recording {
  _id: string;
  title: string;
  description?: string;
  youtubeId: string;
  courseId: Course;
  moduleId: Module;
  order: number;
  duration: string | number;
  createdAt: string;
}

export default function RecordingManagement() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = useState<Recording | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [youtubeId, setYoutubeId] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [order, setOrder] = useState<number | "">("");
  const [durationMin, setDurationMin] = useState<number | "">("");
  const [durationSec, setDurationSec] = useState<number | "">("");

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [recRes, courseRes] = await Promise.all([
        apiRequest("/videos"), // GET /api/videos should return all videos populated
        apiRequest("/courses")
      ]);
      
      if (recRes.success) setRecordings(recRes.data);
      if (courseRes.success) setCourses(courseRes.data);
      
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch modules when course changes
  useEffect(() => {
    if (selectedCourse) {
      apiRequest(`/modules/${selectedCourse}`).then(res => {
        if (res.success) {
          setModules(res.data);
        }
      });
    } else {
      setModules([]);
    }
    // Only reset module if not editing to prevent wiping out selected module
    if (!editId) {
      setSelectedModule("");
    }
  }, [selectedCourse, editId]);

  // Auto-calculate order when module changes
  useEffect(() => {
    if (selectedModule && recordings.length > 0 && !editId) {
      const moduleVideos = recordings.filter(r => r.moduleId?._id === selectedModule);
      if (moduleVideos.length > 0) {
        const maxOrder = Math.max(...moduleVideos.map(v => v.order));
        setOrder(maxOrder + 1);
      } else {
        setOrder(1);
      }
    } else if (selectedModule && !editId) {
      setOrder(1);
    }
  }, [selectedModule, recordings, editId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title || !youtubeId || !selectedCourse || !selectedModule || order === "" || durationMin === "" || durationSec === "") {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      const durStr = `${durationMin}:${durationSec.toString().padStart(2, '0')}`;
      
      const payload = {
        title,
        description,
        youtubeId,
        courseId: selectedCourse,
        moduleId: selectedModule,
        order: Number(order),
        duration: durStr
      };

      const res = editId 
        ? await apiRequest(`/videos/${editId}`, { method: "PUT", body: JSON.stringify(payload) })
        : await apiRequest("/videos", { method: "POST", body: JSON.stringify(payload) });

      if (res.success) {
        handleCloseModal();
        fetchData();
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (rec: Recording) => {
    setEditId(rec._id);
    setTitle(rec.title);
    setDescription(rec.description || "");
    setYoutubeId(rec.youtubeId);
    setSelectedCourse(rec.courseId?._id);
    setSelectedModule(rec.moduleId?._id);
    setOrder(rec.order);
    
    if (typeof rec.duration === 'string' && rec.duration.includes(':')) {
       const parts = rec.duration.split(':');
       setDurationMin(Number(parts[0]));
       setDurationSec(Number(parts[1]));
    } else {
       setDurationMin(Number(rec.duration) || 0);
       setDurationSec(0);
    }
    
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this recording?")) {
      try {
        const res = await apiRequest(`/videos/${id}`, { method: "DELETE" });
        if (res.success) {
          fetchData();
        } else {
          alert(res.message || "Failed to delete recording");
        }
      } catch (err: any) {
        console.error(err);
        alert("Error deleting recording");
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditId(null);
    setTitle("");
    setDescription("");
    setYoutubeId("");
    setSelectedCourse("");
    setSelectedModule("");
    setOrder("");
    setDurationMin("");
    setDurationSec("");
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-8 pb-16">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-manrope font-bold tracking-tight mb-2">Class Recordings</h1>
          <p className="text-on_surface_variant">Azure Academy • Library Management</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-on_primary px-6 py-2.5 rounded-full font-bold shadow-ambient flex items-center gap-2 hover:scale-105 active:scale-95 transition-all text-sm"
        >
          <Plus className="w-4 h-4" /> Create New Entry
        </button>
      </header>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KnowledgeCard className="p-6">
           <div className="flex gap-4 items-center">
              <div className="p-3 rounded-xl bg-surface_container_high text-primary">
                <Video className="w-5 h-5" />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Total Recordings</p>
                 <h3 className="text-2xl font-bold font-manrope">{recordings.length}</h3>
              </div>
           </div>
        </KnowledgeCard>
        <KnowledgeCard className="p-6">
           <div className="flex gap-4 items-center">
              <div className="p-3 rounded-xl bg-surface_container_high text-secondary">
                <PlayCircle className="w-5 h-5" />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Active Courses</p>
                 <h3 className="text-2xl font-bold font-manrope">{courses.length}</h3>
              </div>
           </div>
        </KnowledgeCard>
        <KnowledgeCard className="p-6">
           <div className="flex gap-4 items-center">
              <div className="p-3 rounded-xl bg-surface_container_high text-primary_fixed_variant">
                <HardDrive className="w-5 h-5" />
              </div>
              <div className="flex-1">
                 <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Storage Used</p>
                 <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-bold font-manrope">84%</h3>
                    <div className="flex-1 h-1.5 bg-surface_container_highest rounded-full overflow-hidden">
                       <div className="h-full bg-primary" style={{ width: '84%' }} />
                    </div>
                 </div>
              </div>
           </div>
        </KnowledgeCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recording List */}
        <div className="lg:col-span-2 space-y-4">
           <h2 className="text-xl font-bold font-manrope text-on_surface mb-4">Recent Library Activity</h2>
           {isLoading ? (
             <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
           ) : recordings.length === 0 ? (
             <p className="text-sm text-on_surface_variant">No recordings uploaded yet.</p>
           ) : (
             <div className="space-y-4">
                {recordings.map((rec) => (
                  <div key={rec._id} onClick={() => setPlayingVideo(rec)} className="flex flex-col sm:flex-row gap-4 p-5 bg-surface_container_lowest rounded-2xl border border-outline_variant/20 hover:border-primary/30 transition-all group cursor-pointer shadow-ambient">
                     <div className="w-full sm:w-40 aspect-video rounded-xl bg-surface_container_high flex items-center justify-center relative overflow-hidden">
                        <PlayCircle className="w-10 h-10 text-primary opacity-60 group-hover:scale-110 transition-transform" />
                     </div>
                     <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                           <div className="flex justify-between items-start">
                              <h3 className="font-bold text-on_surface group-hover:text-primary transition-colors">Session {rec.order}: {rec.title}</h3>
                              <div className="relative group/menu">
                                <button className="p-1 hover:bg-surface_container_high rounded-full"><MoreHorizontal className="w-4 h-4 text-outline" /></button>
                                <div className="absolute right-0 top-8 w-32 bg-surface_container_lowest border border-outline_variant/30 rounded-xl shadow-ambient opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-200 z-50 overflow-hidden">
                                  <button onClick={(e) => { e.stopPropagation(); handleEdit(rec); }} className="w-full text-left px-4 py-2 text-sm text-on_surface hover:bg-surface_container_high font-semibold">Edit</button>
                                  <button onClick={(e) => { e.stopPropagation(); handleDelete(rec._id); }} className="w-full text-left px-4 py-2 text-sm text-error hover:bg-error/10 font-semibold">Delete</button>
                                </div>
                              </div>
                           </div>
                           <p className="text-xs text-on_surface_variant mt-1 font-medium">{rec.courseId?.title} • {rec.moduleId?.title}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                           <div className="flex items-center gap-2 text-[10px] font-bold text-outline uppercase tracking-wider">
                              <Calendar className="w-3.5 h-3.5" /> {formatDate(rec.createdAt)}
                           </div>
                           <div className="flex items-center gap-2 text-[10px] font-bold text-outline uppercase tracking-wider">
                              <Clock className="w-3.5 h-3.5" /> {rec.duration}
                           </div>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
           )}
        </div>

        {/* Sidebar Ops */}
        <div className="space-y-6">
           <KnowledgeCard className="bg-surface_container_low border-primary/10">
              <CardBody className="p-8">
                 <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                    <CloudUpload className="w-6 h-6" />
                 </div>
                 <h3 className="font-manrope font-bold text-lg mb-2">Sync to Azure</h3>
                 <p className="text-sm text-on_surface_variant leading-relaxed mb-6">
                   Automatically backup your YouTube recordings to the academy&apos;s secure internal cloud storage every Sunday at 02:00 AM.
                 </p>
                 <button className="w-full bg-primary text-on_primary py-3 rounded-full font-bold text-sm shadow-ambient hover:opacity-90 transition-opacity">
                    Configure Auto-Sync
                 </button>
              </CardBody>
           </KnowledgeCard>

           <div className="p-6 rounded-2xl bg-secondary/5 border border-secondary/20">
              <div className="flex gap-4 items-start">
                 <PlayCircle className="w-5 h-5 text-secondary mt-0.5" />
                 <div>
                    <h4 className="text-sm font-bold text-on_surface">Automated Playlists</h4>
                    <p className="text-xs text-on_surface_variant mt-1">Smart collections are being generated based on module cross-referencing.</p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Create Recording Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-surface_container_lowest w-full max-w-2xl rounded-[2rem] shadow-2xl border border-outline_variant/20 overflow-hidden">
              <div className="p-6 border-b border-outline_variant/10 flex justify-between items-center">
                 <h2 className="text-xl font-bold font-manrope">{editId ? "Edit Recording" : "Upload New Recording"}</h2>
                 <button onClick={handleCloseModal} className="p-2 hover:bg-surface_container_high rounded-full">
                    <X className="w-5 h-5" />
                 </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                 {error && <div className="p-3 bg-error/10 text-error rounded-xl text-sm font-bold">{error}</div>}
                 
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-outline">Video Title</label>
                    <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-surface_container_low border border-outline_variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50" placeholder="e.g. Identity Access Management" />
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-outline">Description</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-surface_container_low border border-outline_variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 min-h-[80px]" placeholder="Optional description..." />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-outline">Course</label>
                       <select required value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} className="w-full bg-surface_container_low border border-outline_variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50">
                          <option value="">Select Course</option>
                          {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-outline">Module</label>
                       <select required disabled={!selectedCourse} value={selectedModule} onChange={e => setSelectedModule(e.target.value)} className="w-full bg-surface_container_low border border-outline_variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 disabled:opacity-50">
                          <option value="">Select Module</option>
                          {modules.map(m => <option key={m._id} value={m._id}>{m.title}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-outline">Order (Session Number)</label>
                       <input required type="number" min="1" value={order} onChange={e => setOrder(e.target.value ? Number(e.target.value) : "")} className="w-full bg-surface_container_low border border-outline_variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-outline">Duration (MM:SS)</label>
                       <div className="flex gap-2">
                         <div className="flex-1 relative">
                           <input required type="number" min="0" placeholder="Min" value={durationMin} onChange={e => setDurationMin(e.target.value ? Number(e.target.value) : "")} className="w-full bg-surface_container_low border border-outline_variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 pr-10" />
                           <span className="absolute right-4 top-3 text-xs text-outline font-bold">m</span>
                         </div>
                         <div className="flex-1 relative">
                           <input required type="number" min="0" max="59" placeholder="Sec" value={durationSec} onChange={e => setDurationSec(e.target.value ? Number(e.target.value) : "")} className="w-full bg-surface_container_low border border-outline_variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 pr-10" />
                           <span className="absolute right-4 top-3 text-xs text-outline font-bold">s</span>
                         </div>
                       </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-outline">YouTube ID</label>
                       <input required type="text" value={youtubeId} onChange={e => setYoutubeId(e.target.value)} className="w-full bg-surface_container_low border border-outline_variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50" placeholder="e.g. dQw4w9WgXcQ" />
                    </div>
                 </div>

                 <div className="pt-6">
                    <button disabled={isSubmitting} type="submit" className="w-full bg-primary text-on_primary py-4 rounded-xl font-bold text-sm shadow-ambient hover:opacity-90 transition-opacity disabled:opacity-50 flex justify-center items-center gap-2">
                       {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Recording"}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Video Player Full Screen Modal */}
      {playingVideo && (
        <div className="fixed inset-0 z-[100] bg-background flex flex-col animate-in fade-in duration-200">
          <header className="h-16 border-b border-outline_variant/20 bg-surface_container_lowest flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-4">
              <button onClick={() => setPlayingVideo(null)} className="p-2 hover:bg-surface_container_high rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5 text-on_surface" />
              </button>
              <div className="h-8 w-px bg-outline_variant/20 mx-2" />
              <h1 className="font-manrope font-bold text-lg truncate max-w-md">{playingVideo.title}</h1>
            </div>
          </header>
          <div className="flex-1 flex items-center justify-center bg-black relative p-4 md:p-12">
            <div className="w-full max-w-5xl aspect-video">
              <PremiumVideoPlayer 
                url={playingVideo.youtubeId} 
                title={playingVideo.title}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
