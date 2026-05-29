"use client";

import { useEffect, useState, use } from "react";
import { KnowledgeCard, CardBody } from "@/components/KnowledgeCard";
import {
  ArrowLeft, Plus, Trash2, GripVertical,
  Save, Video, FileText, Layout, RefreshCw, ChevronDown, ChevronRight, X
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { apiRequest } from "@/lib/api";

// ── CHAPTER ROW COMPONENT ───────────────────────────────────────────────────
function ChapterRow({ chapter, onUpdate, onDelete }: { chapter: any, onUpdate: (id: string, data: any) => Promise<void>, onDelete: (id: string) => void }) {
  const [formData, setFormData] = useState({
    title: chapter.title,
    youtubeId: chapter.youtubeId || "",
    duration: chapter.duration || "00:00",
    description: chapter.description || ""
  });
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await onUpdate(chapter._id, formData);
      setIsDirty(false);
    } catch (err) {
      alert("Failed to save chapter");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex gap-4 items-start bg-surface_container_low/40 p-4 rounded-xl border border-outline_variant/10 group">
      <div className="mt-2 text-outline group-hover:text-primary transition-colors shrink-0">
        <GripVertical className="w-4 h-4 cursor-move" />
      </div>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-5">
          <label className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1 block">Title</label>
          <input
            className="w-full bg-surface_container_lowest border border-outline_variant/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
            value={formData.title}
            onChange={e => handleChange("title", e.target.value)}
          />
        </div>
        <div className="md:col-span-5">
          <label className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1 block">YouTube ID</label>
          <input
            className="w-full bg-surface_container_lowest border border-outline_variant/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
            value={formData.youtubeId}
            onChange={e => handleChange("youtubeId", e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1 block">Duration</label>
          <input
            className="w-full bg-surface_container_lowest border border-outline_variant/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
            value={formData.duration}
            onChange={e => handleChange("duration", e.target.value)}
          />
        </div>
        <div className="md:col-span-12">
          <label className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1 block">Chapter Abstract</label>
          <textarea
            rows={2}
            className="w-full bg-surface_container_lowest border border-outline_variant/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50 resize-none"
            value={formData.description}
            onChange={e => handleChange("description", e.target.value)}
          />
        </div>
        
        {isDirty && (
          <div className="md:col-span-12 flex justify-end pt-2">
             <button 
              onClick={handleSave}
              disabled={saving}
              className="bg-primary text-on_primary px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-ambient"
             >
                {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Save Changes
             </button>
          </div>
        )}
      </div>
      <button
        onClick={() => onDelete(chapter._id)}
        className="mt-6 p-2 text-on_surface_variant hover:text-error transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function AdminCourseEditor({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedMods, setExpandedMods] = useState<Set<string>>(new Set());
  
  // Module Creation Modal
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleOrder, setModuleOrder] = useState<number>(1);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await db.user.getAdminCourseDetails(courseId);
      if (!data) throw new Error("Course not found");
      setCourse(data.course);
      setModules(data.modules || []);
      setExpandedMods(new Set((data.modules || []).map((m: any) => m._id)));
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load course");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourse(); }, [courseId]);

  // ── MODULE ACTIONS ───────────────────────────────────────────────────────────
  const openModuleModal = () => {
    // Find the max order or use modules.length + 1
    const nextOrder = modules.length > 0 
      ? Math.max(...modules.map(m => m.order || 0)) + 1 
      : 1;
    setModuleOrder(nextOrder);
    setModuleTitle("");
    setIsModuleModalOpen(true);
  };

  const handleAddModule = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!moduleTitle.trim()) return;

    try {
      setSaving(true);
      const res = await apiRequest(`/modules`, {
        method: "POST",
        body: JSON.stringify({ 
          courseId, 
          title: moduleTitle, 
          order: moduleOrder 
        })
      });
      if (res.success) {
        await fetchCourse();
        setIsModuleModalOpen(false);
      } else {
        alert(res.message || "Error adding module");
      }
    } catch (err) {
      console.error(err);
      alert("Error adding module");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateModule = async (moduleId: string, title: string) => {
    try {
      await apiRequest(`/modules/${moduleId}`, {
        method: "PUT",
        body: JSON.stringify({ title })
      });
    } catch (err) {
      console.error("Module update error:", err);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm("Delete this module and all its chapters?")) return;
    try {
      setSaving(true);
      await apiRequest(`/modules/${moduleId}`, { method: "DELETE" });
      await fetchCourse();
    } catch (err) {
      alert("Error deleting module");
    } finally {
      setSaving(false);
    }
  };

  // ── CHAPTER ACTIONS ──────────────────────────────────────────────────────────
  const handleAddChapter = async (moduleId: string) => {
    try {
      setSaving(true);
      const res = await apiRequest(`/videos`, {
        method: "POST",
        body: JSON.stringify({
          title: "New Chapter",
          youtubeId: "",
          courseId,
          moduleId,
          order: (modules.find((m: any) => m._id === moduleId)?.videos?.length || 0) + 1,
          duration: "00:00",
          description: ""
        })
      });
      if (res.success) {
        await fetchCourse();
        setExpandedMods(prev => new Set([...prev, moduleId]));
      } else {
        alert(res.message || "Error adding chapter");
      }
    } catch (err) {
      console.error(err);
      alert("Error adding chapter");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateChapterFull = async (videoId: string, data: any) => {
    try {
      await apiRequest(`/videos/${videoId}`, {
        method: "PUT",
        body: JSON.stringify(data)
      });
    } catch (err) {
      console.error("Chapter update error:", err);
      throw err;
    }
  };

  const handleDeleteChapter = async (videoId: string) => {
    if (!confirm("Delete this chapter?")) return;
    try {
      setSaving(true);
      await apiRequest(`/videos/${videoId}`, { method: "DELETE" });
      await fetchCourse();
    } catch (err) {
      alert("Error deleting chapter");
    } finally {
      setSaving(false);
    }
  };

  const toggleMod = (id: string) => {
    setExpandedMods(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (loading) return (
    <div className="p-20 text-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-on_surface_variant animate-pulse">Loading Course Architecture...</p>
    </div>
  );

  if (error) return (
    <div className="p-20 text-center">
      <p className="text-error font-bold mb-4">{error}</p>
      <button onClick={fetchCourse} className="text-sm text-primary hover:underline">Try Again</button>
    </div>
  );

  return (
    <div className="space-y-8 pb-20 max-w-5xl mx-auto">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/admin/courses" className="p-2 hover:bg-surface_container_high rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-manrope font-bold tracking-tight">{course?.title}</h1>
            <p className="text-sm text-on_surface_variant">
              {modules.length} modules · {modules.reduce((a, m) => a + (m.videos?.length || 0), 0)} chapters
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchCourse}
            disabled={saving}
            className="p-2 hover:bg-surface_container_high rounded-full transition-colors text-on_surface_variant"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${saving ? "animate-spin" : ""}`} />
          </button>
          <span className="text-xs text-outline">Changes require explicit save</span>
        </div>
      </header>

      {/* Modules */}
      <div className="space-y-4">
        {modules.length === 0 ? (
          <KnowledgeCard className="p-16 text-center border-dashed">
            <Layout className="w-10 h-10 text-outline/30 mx-auto mb-4" />
            <p className="font-bold text-on_surface_variant mb-1">No modules yet</p>
            <p className="text-sm text-outline">Start by adding a module to this course.</p>
          </KnowledgeCard>
        ) : (
          modules.map((mod: any, modIdx: number) => (
            <div key={mod._id} className="bg-surface_container_lowest rounded-2xl border border-outline_variant/20 overflow-hidden shadow-sm">
              <div className="bg-surface_container_low px-6 py-4 flex justify-between items-center border-b border-outline_variant/10">
                <div className="flex items-center gap-4">
                  <button onClick={() => toggleMod(mod._id)} className="text-outline hover:text-primary transition-colors">
                    {expandedMods.has(mod._id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    {modIdx + 1}
                  </div>
                  <input
                    className="bg-transparent font-bold font-manrope text-lg focus:outline-none border-b border-transparent focus:border-primary/40 px-1 min-w-0"
                    defaultValue={mod.title}
                    onBlur={e => handleUpdateModule(mod._id, e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-on_surface_variant font-medium">{mod.videos?.length || 0} Chapters</span>
                  <button
                    onClick={() => handleDeleteModule(mod._id)}
                    className="text-error hover:bg-error/5 p-2 rounded-lg transition-colors"
                    title="Delete Module"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {expandedMods.has(mod._id) && (
                <div className="p-6 space-y-4">
                  {(mod.videos || []).map((chapter: any, chIdx: number) => (
                    <ChapterRow 
                      key={chapter._id} 
                      chapter={chapter} 
                      onUpdate={handleUpdateChapterFull}
                      onDelete={handleDeleteChapter}
                    />
                  ))}
                  <button
                    onClick={() => handleAddChapter(mod._id)}
                    disabled={saving}
                    className="w-full py-4 border-2 border-dashed border-outline_variant/30 rounded-xl flex items-center justify-center gap-2 text-on_surface_variant hover:border-primary/40 hover:text-primary transition-all group disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold uppercase tracking-widest">Add New Chapter</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}

        {/* Add Module Button */}
        <button
          onClick={openModuleModal}
          disabled={saving}
          className="w-full py-6 bg-primary/5 border border-primary/20 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-primary/10 transition-all group disabled:opacity-50"
        >
          <Layout className="w-6 h-6 text-primary mb-1" />
          <span className="text-sm font-bold text-primary">
            {saving ? "Processing..." : "Create New Module Section"}
          </span>
        </button>
      </div>

      {/* Module Creation Modal */}
      {isModuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface_container_lowest w-full max-w-md rounded-2xl shadow-ambient border border-outline_variant/20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-outline_variant/10">
              <h2 className="text-xl font-bold text-on_surface font-manrope">New Module</h2>
              <button onClick={() => setIsModuleModalOpen(false)} className="text-on_surface_variant hover:text-on_surface p-2 rounded-full hover:bg-surface_container_high transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddModule} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-outline uppercase tracking-wider mb-2">Module Title</label>
                <input
                  required
                  autoFocus
                  type="text"
                  value={moduleTitle}
                  onChange={e => setModuleTitle(e.target.value)}
                  placeholder="e.g. Introduction to Physics"
                  className="w-full bg-surface_container_low border border-outline_variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-on_surface transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-outline uppercase tracking-wider mb-2">Display Order</label>
                <input
                  required
                  type="number"
                  min="1"
                  value={moduleOrder}
                  onChange={e => setModuleOrder(parseInt(e.target.value) || 1)}
                  className="w-full bg-surface_container_low border border-outline_variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-on_surface transition-all"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModuleModalOpen(false)} 
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-on_surface_variant hover:bg-surface_container_high transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving || !moduleTitle.trim()} 
                  className="flex-1 bg-primary text-on_primary py-3 rounded-xl font-bold text-sm shadow-ambient hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create Module
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
