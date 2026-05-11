"use client";

import { useEffect, useState, useMemo } from "react";
import { KnowledgeCard, CardBody } from "@/components/KnowledgeCard";
import { Plus, Edit2, Trash2, Users, BookOpen, Search, Filter, X, Save, RefreshCw, AlertTriangle, BadgeCheck, GraduationCap } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";

export default function TeacherCourseManagement() {
  const [catalog, setCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: "", description: "", duration: "", isPaid: false, price: 0 });

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const data = await db.user.getCatalog(); 
      setCatalog(data || []);
    } catch (error) {
      console.error("Failed to fetch catalog:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCatalog(); }, []);

  const filteredCatalog = useMemo(() => {
    return catalog.filter(c =>
        c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [catalog, searchQuery]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.title.trim()) return;
    try {
      setSaving(true);
      const res = await db.user.createCourse(newCourse);
      if (res.success) {
        await fetchCatalog();
        setIsCreateOpen(false);
        setNewCourse({ title: "", description: "", duration: "", isPaid: false, price: 0 });
      } else {
        alert(res.message || "Failed to create course");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating course");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-on_surface_variant">Loading Academic Catalog...</div>;

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-manrope font-bold tracking-tight mb-2">Academic Atelier</h1>
          <p className="text-on_surface_variant">Curate your curriculum and manage your course modules with surgical precision.</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="bg-primary text-on_primary px-6 py-2.5 rounded-full font-bold shadow-ambient flex items-center gap-2 hover:scale-105 active:scale-95 transition-all text-sm"
        >
          <Plus className="w-4 h-4" /> Provision New Course
        </button>
      </header>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KnowledgeCard className="p-6 bg-surface_container_low border-primary/10">
           <div className="flex gap-4 items-center">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                 <BookOpen className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Active Catalog</p>
                 <h3 className="text-2xl font-bold font-manrope">{catalog.length} Courses</h3>
              </div>
           </div>
        </KnowledgeCard>

        <KnowledgeCard className="p-6 bg-surface_container_low border-secondary/10">
           <div className="flex gap-4 items-center">
              <div className="p-3 rounded-xl bg-secondary/10 text-secondary">
                 <Users className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Global Reach</p>
                 <h3 className="text-2xl font-bold font-manrope">
                    {catalog.reduce((acc, curr) => acc + (curr.enrolledStudents || 0), 0)} Enrolled
                 </h3>
              </div>
           </div>
        </KnowledgeCard>

        <KnowledgeCard className="p-6 bg-surface_container_low border-outline_variant/30">
           <div className="flex gap-4 items-center">
              <div className="p-3 rounded-xl bg-surface_container_high text-outline">
                 <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Institutional Standard</p>
                 <h3 className="text-2xl font-bold font-manrope">Verified</h3>
              </div>
           </div>
        </KnowledgeCard>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
        <input
          type="text"
          placeholder="Filter courses by title or description..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-surface_container_lowest border border-outline_variant/20 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/50 text-on_surface shadow-sm"
        />
      </div>

      {/* Course Cards */}
      {filteredCatalog.length === 0 ? (
        <div className="p-20 text-center border-2 border-dashed border-outline_variant/20 rounded-3xl">
           <BookOpen className="w-12 h-12 text-outline/20 mx-auto mb-4" />
           <p className="text-on_surface_variant font-medium">No courses found in the atelier.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCatalog.map((course: any) => (
            <KnowledgeCard key={course._id} className="group hover:border-primary/30 transition-all shadow-sm hover:shadow-ambient overflow-hidden">
               <div className="p-0">
                  <div className="h-32 bg-surface_container_highest relative flex items-center justify-center">
                     <BookOpen className="w-12 h-12 text-outline/10" />
                     <div className="absolute top-4 right-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${course.isPaid ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary"}`}>
                           {course.isPaid ? `Premium • ₹${course.price}` : "Open Access"}
                        </span>
                     </div>
                  </div>
                  <div className="p-6">
                     <h3 className="text-lg font-bold font-manrope text-on_surface mb-1 group-hover:text-primary transition-colors">{course.title}</h3>
                     <p className="text-sm text-on_surface_variant line-clamp-2 mb-6 leading-relaxed">
                        {course.description || "Foundational academic module designed for specialized learning paths."}
                     </p>
                     
                     <div className="flex items-center justify-between border-t border-outline_variant/10 pt-4">
                        <div className="flex gap-4">
                           <div className="text-center">
                              <p className="text-[10px] font-bold text-outline uppercase tracking-wider leading-none">{course.moduleCount || 0}</p>
                              <p className="text-[10px] text-outline uppercase mt-0.5">Modules</p>
                           </div>
                           <div className="text-center border-l border-outline_variant/20 pl-4">
                              <p className="text-[10px] font-bold text-outline uppercase tracking-wider leading-none">{course.enrolledStudents || 0}</p>
                              <p className="text-[10px] text-outline uppercase mt-0.5">Students</p>
                           </div>
                        </div>
                        <Link href={`/teacher/courses/${course._id}`}>
                           <button className="flex items-center gap-2 text-xs font-bold text-primary hover:underline">
                              Edit Curriculum <Edit2 className="w-3.5 h-3.5" />
                           </button>
                        </Link>
                     </div>
                  </div>
               </div>
            </KnowledgeCard>
          ))}
        </div>
      )}

      {/* Modal: Create Course */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface_container_lowest w-full max-w-lg rounded-3xl shadow-ambient border border-outline_variant/20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-8 border-b border-outline_variant/10">
              <h2 className="text-2xl font-bold text-on_surface font-manrope">Provision Course</h2>
              <button onClick={() => setIsCreateOpen(false)} className="text-on_surface_variant hover:text-on_surface p-2 rounded-full hover:bg-surface_container_high transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Curriculum Title *</label>
                <input
                  required type="text" value={newCourse.title}
                  onChange={e => setNewCourse({ ...newCourse, title: e.target.value })}
                  className="w-full bg-surface_container_highest border border-outline_variant/30 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-primary/50 text-on_surface transition-colors"
                  placeholder="e.g. Advanced Quantum Mechanics"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Abstract</label>
                <textarea
                  value={newCourse.description}
                  onChange={e => setNewCourse({ ...newCourse, description: e.target.value })}
                  rows={3}
                  className="w-full bg-surface_container_highest border border-outline_variant/30 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-primary/50 text-on_surface transition-colors resize-none"
                  placeholder="Summarize the learning objectives..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Duration</label>
                  <input
                    type="text" value={newCourse.duration}
                    onChange={e => setNewCourse({ ...newCourse, duration: e.target.value })}
                    className="w-full bg-surface_container_highest border border-outline_variant/30 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-primary/50 text-on_surface transition-colors"
                    placeholder="e.g. 12 Weeks"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Price (₹)</label>
                  <input
                    type="number" min="0" value={newCourse.price}
                    onChange={e => setNewCourse({ ...newCourse, price: Number(e.target.value), isPaid: Number(e.target.value) > 0 })}
                    className="w-full bg-surface_container_highest border border-outline_variant/30 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-primary/50 text-on_surface transition-colors"
                    placeholder="0 for Open Access"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="flex-1 py-4 rounded-2xl font-bold text-sm text-on_surface_variant hover:bg-surface_container_high transition-colors">
                  Discard
                </button>
                <button type="submit" disabled={saving} className="flex-1 bg-primary text-on_primary py-4 rounded-2xl font-bold text-sm shadow-ambient hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Finalize Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
