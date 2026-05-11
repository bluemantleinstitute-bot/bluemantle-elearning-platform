"use client";

import { useEffect, useState, useMemo } from "react";
import { KnowledgeCard, CardHeader, CardTitle, CardBody } from "@/components/KnowledgeCard";
import { 
  UploadCloud, FileText, CheckCircle2, AlertCircle, Info, 
  Trash2, ArrowRight, Video, Search, Filter, 
  RefreshCw, Upload, X, ExternalLink, LockKeyhole, Users
} from "lucide-react";
import { db } from "@/lib/db";
import { apiRequest } from "@/lib/api";
import { PremiumUploadZone } from "@/components/PremiumUploadZone";

export default function TeacherMaterials() {
  const [teacherData, setTeacherData] = useState<any>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Upload form states
  const [uploadType, setUploadType] = useState<"video" | "note">("video");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [modules, setModules] = useState<any[]>([]);
  const [fetchingModules, setFetchingModules] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    youtubeId: "",
    duration: "",
    fileUrl: "",
    description: "",
    order: 1,
    resourceType: "Note",
    visibility: "enrolled",
    unlockMode: "auto",
    batchId: "",
    fileSize: "Unknown"
  });

  // Archive states
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchModules(selectedCourse);
    } else {
      setModules([]);
      setSelectedModule("");
    }
  }, [selectedCourse]);

  // Automatically determine the order when course/module changes
  useEffect(() => {
    if (selectedCourse && selectedModule) {
      const relevantMaterials = materials.filter(m => 
        m.courseId?._id === selectedCourse && 
        m.moduleId?._id === selectedModule
      );
      const maxOrder = relevantMaterials.reduce((max, m) => Math.max(max, m.order || 0), 0);
      setFormData(prev => ({ ...prev, order: maxOrder + 1 }));
    }
  }, [selectedCourse, selectedModule, materials]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [data, videos, notes] = await Promise.all([
        db.user.getTeacherData(),
        db.user.getAllVideos(),
        db.user.getAllNotes()
      ]);
      setTeacherData(data);
      
      const combined = [
        ...(videos || []).map((v: any) => ({ ...v, type: "video" })),
        ...(notes || []).map((n: any) => ({ ...n, contentType: n.type, type: "note" }))
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setMaterials(combined);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async (courseId: string) => {
    try {
      setFetchingModules(true);
      const courseData = await db.user.getAdminCourseDetails(courseId);
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

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !selectedModule || !formData.title) return;
    if (uploadType === "note" && formData.visibility === "batch" && !formData.batchId) {
      alert("Please choose a batch for batch-only resources.");
      return;
    }

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
        description: formData.description,
        type: formData.resourceType,
        visibility: formData.visibility,
        unlockMode: formData.unlockMode,
        batchId: formData.visibility === "batch" ? formData.batchId : undefined,
        fileSize: formData.fileSize
      };

      const res = await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      if (res.success) {
        alert(`${uploadType === "video" ? "Video" : "Note"} uploaded successfully!`);
        setFormData({
          title: "",
          youtubeId: "",
          duration: "",
          fileUrl: "",
          description: "",
          order: 1,
          resourceType: "Note",
          visibility: "enrolled",
          unlockMode: "auto",
          batchId: "",
          fileSize: "Unknown"
        });
        fetchInitialData();
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

  const handleDelete = async (id: string, type: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;
    try {
      const success = type === "video" 
        ? await db.user.deleteVideo(id)
        : await db.user.deleteNote(id);
      
      if (success) {
        setMaterials(prev => prev.filter(m => m._id !== id));
      } else {
        alert("Failed to delete resource");
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const getFileFormat = (url: string) => {
    if (!url) return "DOC";
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const ext = pathname.split('.').pop()?.toUpperCase();
      return ext && ext.length < 5 ? ext : "FILE";
    } catch {
      const ext = url.split('.').pop()?.toUpperCase();
      return ext && ext.length < 5 ? ext : "FILE";
    }
  };

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const isNote = m.type === "note";
      const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase());
      const matchesCourse = !courseFilter || m.courseId?._id === courseFilter;
      const matchesModule = !moduleFilter || m.moduleId?._id === moduleFilter;
      return isNote && matchesSearch && matchesCourse && matchesModule;
    });
  }, [materials, search, courseFilter, moduleFilter]);

  const batchOptions = useMemo(() => {
    return (teacherData?.assignedBatches || []).filter((batch: any) => {
      const courseId = batch.courseId?._id || batch.courseId || batch.course?.id;
      return !selectedCourse || courseId === selectedCourse;
    });
  }, [teacherData, selectedCourse]);

  if (loading || !teacherData) {
    return (
      <div className="p-20 text-center animate-pulse">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-on_surface_variant font-medium">Syncing Academic Archives...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-16 animate-in fade-in duration-500">
      <header>
        <h1 className="text-4xl font-manrope font-bold tracking-tight mb-2">Curate Your Curriculum</h1>
        <p className="text-on_surface_variant max-w-2xl text-sm italic opacity-80">
          "The atelier is not merely a workspace, but a laboratory for academic refinement."
        </p>
      </header>

      {/* Top Section: Upload Zone and Guidelines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
           <PremiumUploadZone />
        </div>
        <div className="space-y-6">
           <KnowledgeCard className="bg-surface_container_low border border-outline_variant/10 shadow-sm">
              <CardHeader>
                 <CardTitle className="text-sm flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary" /> Content Standards
                 </CardTitle>
              </CardHeader>
              <CardBody className="space-y-6">
                 <div className="space-y-2">
                    <h5 className="font-bold text-xs text-on_surface">Vector Graphics</h5>
                    <p className="text-[10px] text-on_surface_variant leading-relaxed">
                       Ensure all diagrams are high-resolution for crystal clear student viewing on Retina displays.
                    </p>
                 </div>
                 <div className="space-y-2">
                    <h5 className="font-bold text-xs text-on_surface">Metadata Consistency</h5>
                    <p className="text-[10px] text-on_surface_variant leading-relaxed">
                       Tag your notes correctly to appear in the respective course bento-grids automatically.
                    </p>
                 </div>
                 <div className="space-y-2">
                    <h5 className="font-bold text-xs text-on_surface">Copyright Compliance</h5>
                    <p className="text-[10px] text-on_surface_variant leading-relaxed">
                       By uploading, you confirm ownership or usage rights for the educational material per Azure policy.
                    </p>
                 </div>
              </CardBody>
           </KnowledgeCard>

           <div className="p-5 rounded-2xl bg-secondary/5 border border-secondary/20 flex gap-4">
              <AlertCircle className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
              <div>
                 <h4 className="text-xs font-bold text-on_surface">Sync Notice</h4>
                 <p className="text-[10px] text-on_surface_variant mt-1 leading-relaxed">
                    Files are automatically distributed to student terminals upon synchronization success.
                 </p>
              </div>
           </div>
        </div>
      </div>

      {/* Bottom Section: Archive and Provision Form side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
         {/* Archive Section */}
         <div className="space-y-6">
            <div className="flex flex-col gap-4 px-2">
               <h2 className="text-3xl font-bold font-manrope text-on_surface tracking-tight">Azure Academy Archive</h2>
               <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[140px]">
                     <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                     <input 
                       type="text"
                       value={search}
                       onChange={(e) => setSearch(e.target.value)}
                       placeholder="Search repository..."
                       className="pl-10 pr-3 py-2.5 bg-surface_container_high rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-primary/20 w-full"
                     />
                  </div>
                  <select 
                    value={courseFilter}
                    onChange={(e) => {
                      setCourseFilter(e.target.value);
                      setModuleFilter("");
                    }}
                    className="px-4 py-2.5 bg-surface_container_high rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-primary/20"
                  >
                     <option value="">All Courses</option>
                     {teacherData.assignedCourses?.map((c: any) => (
                       <option key={c.id} value={c.id}>{c.title}</option>
                     ))}
                  </select>
                  {courseFilter && (
                    <select 
                      value={moduleFilter}
                      onChange={(e) => setModuleFilter(e.target.value)}
                      className="px-4 py-2.5 bg-surface_container_high rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-primary/20 animate-in fade-in slide-in-from-left-2"
                    >
                       <option value="">All Modules</option>
                       {Array.from(new Set(materials.filter(m => m.courseId?._id === courseFilter).map(m => JSON.stringify(m.moduleId)))).map(mStr => {
                          const m = JSON.parse(mStr);
                          return <option key={m?._id} value={m?._id}>{m?.title}</option>;
                       })}
                    </select>
                  )}
               </div>
            </div>

            <div className="space-y-3">
               {filteredMaterials.length === 0 ? (
                  <div className="p-20 text-center bg-surface_container_low border-2 border-dashed border-outline_variant/20 rounded-3xl">
                     <FileText className="w-10 h-10 text-outline/30 mx-auto mb-3" />
                     <p className="text-xs text-on_surface_variant font-medium">Empty repository</p>
                  </div>
               ) : (
                  filteredMaterials.map((item, i) => (
                    <div key={item._id} className="flex items-center justify-between p-4 bg-surface_container_lowest border border-outline_variant/10 rounded-2xl hover:shadow-ambient transition-all group animate-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${i * 30}ms` }}>
                       <div className="flex gap-4 items-center">
                          <div className="p-2 rounded-xl bg-surface_container_high text-primary">
                             <FileText className="w-5 h-5" />
                          </div>
                          <div>
                             <div className="flex items-center gap-2">
                                <h4 className="font-bold text-xs text-on_surface group-hover:text-primary transition-colors">{item.title}</h4>
                                <span className="px-1.5 py-0.5 rounded bg-surface_container_highest text-[8px] font-black text-outline uppercase tracking-tighter">
                                   {item.contentType || getFileFormat(item.fileUrl)}
                                </span>
                             </div>
                             <p className="text-[9px] text-outline uppercase font-bold tracking-widest mt-0.5">
                                {item.courseId?.title} • {item.moduleId?.title} • {new Date(item.createdAt).toLocaleDateString()}
                             </p>
                          </div>
                       </div>
                       <div className="flex items-center gap-2">
                          <span title={item.unlockMode === "manual" ? "Manual unlock" : "Auto after completion"} className="p-2 bg-surface_container_high text-outline rounded-lg">
                             {item.visibility === "batch" ? <Users className="w-3.5 h-3.5" /> : <LockKeyhole className="w-3.5 h-3.5" />}
                          </span>
                          <a href={item.type === 'video' ? `https://youtube.com/watch?v=${item.youtubeId}` : item.fileUrl} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-all">
                             <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button onClick={() => handleDelete(item._id, item.type)} className="p-2 hover:bg-error/10 text-outline hover:text-error rounded-lg transition-colors">
                             <Trash2 className="w-3.5 h-3.5" />
                          </button>
                       </div>
                    </div>
                  ))
               )}
            </div>
         </div>

         {/* Provision Form Section */}
         <KnowledgeCard className="overflow-hidden border-primary/10 shadow-ambient sticky top-8">
            <CardHeader className="bg-primary/5 border-b border-primary/10 py-5 px-6">
               <div className="flex justify-between items-center w-full">
                  <CardTitle className="text-sm flex items-center gap-2">
                     <UploadCloud className="w-4 h-4 text-primary" /> 
                     Quick Provision
                  </CardTitle>
                  <div className="flex bg-surface_container_high p-1 rounded-xl">
                     <button onClick={() => setUploadType("video")} className={`px-5 py-2 rounded-lg text-[10px] font-bold tracking-widest transition-all ${uploadType === "video" ? "bg-primary text-on_primary shadow-sm" : "text-on_surface_variant"}`}>VIDEO</button>
                     <button onClick={() => setUploadType("note")} className={`px-5 py-2 rounded-lg text-[10px] font-bold tracking-widest transition-all ${uploadType === "note" ? "bg-primary text-on_primary shadow-sm" : "text-on_surface_variant"}`}>NOTE</button>
                  </div>
               </div>
            </CardHeader>
            <CardBody className="p-6">
               <form onSubmit={handleUpload} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-[9px] font-bold text-outline uppercase tracking-widest mb-1.5">Target Course</label>
                       <select required value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="w-full bg-surface_container_high border border-outline_variant/20 rounded-xl px-3 py-2.5 text-xs text-on_surface focus:ring-2 focus:ring-primary/20 outline-none">
                         <option value="">Choose Course</option>
                         {teacherData.assignedCourses?.map((c: any) => (
                           <option key={c.id} value={c.id}>{c.title}</option>
                         ))}
                       </select>
                     </div>
                     <div>
                       <label className="block text-[9px] font-bold text-outline uppercase tracking-widest mb-1.5">Module</label>
                       <select required disabled={!selectedCourse || fetchingModules} value={selectedModule} onChange={(e) => setSelectedModule(e.target.value)} className="w-full bg-surface_container_high border border-outline_variant/20 rounded-xl px-3 py-2.5 text-xs text-on_surface focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-50">
                         <option value="">{fetchingModules ? "Syncing..." : "Choose Module"}</option>
                         {modules.map((m: any) => (
                           <option key={m._id} value={m._id}>{m.title}</option>
                         ))}
                       </select>
                     </div>
                  </div>

                  <div>
                     <label className="block text-[9px] font-bold text-outline uppercase tracking-widest mb-1.5">Resource Title</label>
                     <input required type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Title of material" className="w-full bg-surface_container_low border border-outline_variant/20 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-primary/50 text-on_surface" />
                  </div>

                  {uploadType === "video" ? (
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="block text-[9px] font-bold text-outline uppercase tracking-widest mb-1.5">YouTube ID</label>
                          <input required type="text" value={formData.youtubeId} onChange={(e) => setFormData({...formData, youtubeId: e.target.value})} placeholder="Video ID" className="w-full bg-surface_container_low border border-outline_variant/20 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-primary/50 text-on_surface" />
                       </div>
                       <div>
                          <label className="block text-[9px] font-bold text-outline uppercase tracking-widest mb-1.5">Duration</label>
                          <input required type="text" value={formData.duration} onChange={(e) => setFormData({...formData, duration: e.target.value})} placeholder="Min" className="w-full bg-surface_container_low border border-outline_variant/20 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-primary/50 text-on_surface" />
                       </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                       <div>
                          <label className="block text-[9px] font-bold text-outline uppercase tracking-widest mb-1.5">Secure File URL</label>
                          <input required type="url" value={formData.fileUrl} onChange={(e) => setFormData({...formData, fileUrl: e.target.value})} placeholder="Drive, S3, or CDN link" className="w-full bg-surface_container_low border border-outline_variant/20 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-primary/50 text-on_surface" />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                             <label className="block text-[9px] font-bold text-outline uppercase tracking-widest mb-1.5">Resource Type</label>
                             <select value={formData.resourceType} onChange={(e) => setFormData({...formData, resourceType: e.target.value})} className="w-full bg-surface_container_high border border-outline_variant/20 rounded-xl px-3 py-2.5 text-xs text-on_surface focus:ring-2 focus:ring-primary/20 outline-none">
                                <option value="Note">Note</option>
                                <option value="PDF">PDF</option>
                                <option value="Assignment">Assignment</option>
                                <option value="Resource">Resource</option>
                             </select>
                          </div>
                          <div>
                             <label className="block text-[9px] font-bold text-outline uppercase tracking-widest mb-1.5">Unlock</label>
                             <select value={formData.unlockMode} onChange={(e) => setFormData({...formData, unlockMode: e.target.value})} className="w-full bg-surface_container_high border border-outline_variant/20 rounded-xl px-3 py-2.5 text-xs text-on_surface focus:ring-2 focus:ring-primary/20 outline-none">
                                <option value="auto">Auto after module completion</option>
                                <option value="manual">Manual unlock</option>
                             </select>
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                             <label className="block text-[9px] font-bold text-outline uppercase tracking-widest mb-1.5">Visibility</label>
                             <select value={formData.visibility} onChange={(e) => setFormData({...formData, visibility: e.target.value, batchId: e.target.value === "batch" ? formData.batchId : ""})} className="w-full bg-surface_container_high border border-outline_variant/20 rounded-xl px-3 py-2.5 text-xs text-on_surface focus:ring-2 focus:ring-primary/20 outline-none">
                                <option value="enrolled">Course students</option>
                                <option value="batch">Specific batch</option>
                                <option value="hidden">Hidden</option>
                             </select>
                          </div>
                          <div>
                             <label className="block text-[9px] font-bold text-outline uppercase tracking-widest mb-1.5">Batch</label>
                             <select disabled={formData.visibility !== "batch"} required={formData.visibility === "batch"} value={formData.batchId} onChange={(e) => setFormData({...formData, batchId: e.target.value})} className="w-full bg-surface_container_high border border-outline_variant/20 rounded-xl px-3 py-2.5 text-xs text-on_surface focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-50">
                                <option value="">Choose Batch</option>
                                {batchOptions.map((batch: any) => (
                                  <option key={batch._id || batch.id} value={batch._id || batch.id}>{batch.name}</option>
                                ))}
                             </select>
                          </div>
                       </div>
                    </div>
                  )}

                  <div className="flex gap-4 pt-2">
                     <div className="w-20">
                        <label className="block text-[9px] font-bold text-outline uppercase tracking-widest mb-1.5">Order</label>
                        <input type="number" min="1" value={formData.order} onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 1})} className="w-full bg-surface_container_low border border-outline_variant/20 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-primary/50 text-on_surface" />
                     </div>
                     <button type="submit" disabled={uploading} className="flex-1 bg-primary text-on_primary rounded-xl font-bold text-[10px] tracking-widest shadow-glow hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        {uploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                        FINALIZE
                     </button>
                  </div>
               </form>
            </CardBody>
         </KnowledgeCard>
      </div>

      <footer className="pt-8 opacity-40 text-center">
         <p className="text-[8px] font-bold text-outline uppercase tracking-[0.3em]">Azure Academy Administrative System • Material Atelier</p>
      </footer>
    </div>
  );
}

