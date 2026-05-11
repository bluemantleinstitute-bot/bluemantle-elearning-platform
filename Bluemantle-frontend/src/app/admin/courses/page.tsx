"use client";

import { useEffect, useState, useMemo } from "react";
import { KnowledgeCard, CardBody } from "@/components/KnowledgeCard";
import { Plus, Edit2, Trash2, Users, BookOpen, Search, Filter, X, Save, RefreshCw, AlertTriangle, BadgeCheck } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";

export default function AdminCourseManagement() {
  const [catalog, setCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active");

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: "", description: "", duration: "", isPaid: false, price: 0 });

  // Edit Modal
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", duration: "", isPaid: false, price: 0 });

  // Delete Confirm
  const [deletingCourse, setDeletingCourse] = useState<any>(null);

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const data = await db.user.getAllCourses(); // fetch all (active + inactive)
      setCatalog(data || []);
    } catch (error) {
      console.error("Failed to fetch catalog:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCatalog(); }, []);

  const filteredCatalog = useMemo(() => {
    return catalog
      .filter(c => {
        if (statusFilter === "active") return c.isActive !== false;
        if (statusFilter === "inactive") return c.isActive === false;
        return true;
      })
      .filter(c =>
        c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [catalog, searchQuery, statusFilter]);

  // ── CREATE ──────────────────────────────────────────────────────────────────
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

  // ── EDIT ────────────────────────────────────────────────────────────────────
  const openEdit = (course: any) => {
    setEditingCourse(course);
    setEditForm({
      title: course.title || "",
      description: course.description || "",
      duration: course.duration || "",
      isPaid: course.isPaid || false,
      price: course.price || 0
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    try {
      setSaving(true);
      const res = await db.user.updateCourse(editingCourse._id, editForm);
      if (res.success) {
        await fetchCatalog();
        setEditingCourse(null);
      } else {
        alert(res.message || "Failed to update course");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating course");
    } finally {
      setSaving(false);
    }
  };

  // ── SOFT DELETE ─────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deletingCourse) return;
    try {
      setSaving(true);
      const res = await db.user.deleteCourse(deletingCourse._id);
      if (res.success) {
        await fetchCatalog();
        setDeletingCourse(null);
      } else {
        alert(res.message || "Failed to deactivate course");
      }
    } catch (err) {
      console.error(err);
      alert("Error deactivating course");
    } finally {
      setSaving(false);
    }
  };

  // ── RESTORE ─────────────────────────────────────────────────────────────────
  const handleRestore = async (course: any) => {
    try {
      setSaving(true);
      const res = await db.user.restoreCourse(course._id);
      if (res.success) {
        await fetchCatalog();
      } else {
        alert(res.message || "Failed to restore course");
      }
    } catch (err) {
      console.error(err);
      alert("Error restoring course");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-on_surface_variant">Loading Catalog...</div>;

  const activeCount = catalog.filter(c => c.isActive !== false).length;
  const inactiveCount = catalog.filter(c => c.isActive === false).length;

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-manrope font-bold tracking-tight mb-2">Academy Catalog</h1>
          <p className="text-on_surface_variant">Manage your recorded courses, modules, and learning paths.</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="bg-primary text-on_primary px-6 py-2.5 rounded-full font-bold shadow-ambient flex items-center gap-2 hover:scale-105 active:scale-95 transition-all text-sm"
        >
          <Plus className="w-4 h-4" /> Create New Course
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Courses", value: catalog.length },
          { label: "Total Modules", value: catalog.reduce((a, c) => a + (c.moduleCount || 0), 0) },
          { label: "Enrolled Students", value: catalog.reduce((a, c) => a + (c.enrolledStudents || 0), 0) },
          { label: "Paid Courses", value: catalog.filter(c => c.isPaid).length },
        ].map(stat => (
          <KnowledgeCard key={stat.label} className="p-5">
            <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1">{stat.label}</p>
            <h3 className="text-2xl font-bold font-manrope">{stat.value}</h3>
          </KnowledgeCard>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-48 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-surface_container_lowest border border-outline_variant/20 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/50 text-on_surface"
          />
        </div>
        <div className="flex bg-surface_container_lowest border border-outline_variant/20 rounded-xl overflow-hidden">
          {([
            { key: "all", label: `All (${catalog.length})` },
            { key: "active", label: `Active (${activeCount})` },
            { key: "inactive", label: `Inactive (${inactiveCount})` },
          ] as const).map(opt => (
            <button
              key={opt.key}
              onClick={() => setStatusFilter(opt.key)}
              className={`px-4 py-2.5 text-sm font-bold transition-colors ${
                statusFilter === opt.key
                  ? "bg-primary text-on_primary"
                  : "text-on_surface_variant hover:bg-surface_container_high"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Course List */}
      {filteredCatalog.length === 0 ? (
        <KnowledgeCard className="p-16 text-center border-dashed">
          <BookOpen className="w-10 h-10 text-outline/30 mx-auto mb-4" />
          <p className="font-bold text-on_surface_variant">No courses found</p>
          <button onClick={() => setIsCreateOpen(true)} className="mt-4 text-sm font-bold text-primary hover:underline">
            Create your first course →
          </button>
        </KnowledgeCard>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredCatalog.map((course: any) => (
            <KnowledgeCard key={course._id} className="group hover:border-primary/20 transition-all">
              <CardBody className="p-0">
                <div className="flex flex-col md:flex-row">
                  {/* Thumbnail */}
                  <div className="w-full md:w-64 aspect-video bg-surface_container_highest shrink-0 relative overflow-hidden md:rounded-l-2xl">
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <BookOpen className="w-8 h-8 text-outline/20" />
                      <span className="text-[10px] font-bold text-outline/40 uppercase tracking-widest">
                        {course.moduleCount || 0} Modules
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold font-manrope text-on_surface truncate">{course.title}</h3>
                          {course.isPaid && (
                            <span className="text-[10px] font-bold bg-secondary/10 text-secondary px-2 py-0.5 rounded-full shrink-0">
                              PAID • ₹{course.price}
                            </span>
                          )}
                          {course.isActive === false && (
                            <span className="text-[10px] font-bold bg-error/10 text-error px-2 py-0.5 rounded-full shrink-0">
                              INACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-on_surface_variant line-clamp-1">{course.description || "No description provided."}</p>
                        {course.duration && (
                          <p className="text-[10px] text-outline font-bold uppercase tracking-wider mt-1">⏱ {course.duration}</p>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {course.isActive !== false ? (
                          <>
                            <button
                              onClick={() => openEdit(course)}
                              className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                              title="Edit Course"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <Link href={`/admin/courses/${course._id}`}>
                              <button className="p-2 hover:bg-surface_container_high text-on_surface_variant rounded-lg transition-colors" title="View Content">
                                <BookOpen className="w-4 h-4" />
                              </button>
                            </Link>
                            <button
                              onClick={() => setDeletingCourse(course)}
                              className="p-2 hover:bg-error/10 text-error rounded-lg transition-colors"
                              title="Deactivate Course"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleRestore(course)}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary/20 transition-colors disabled:opacity-50"
                            title="Restore Course"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Restore
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-8 mt-6">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-surface_container_high text-primary">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Modules</p>
                          <p className="text-sm font-bold">{course.moduleCount || 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-surface_container_high text-secondary">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Enrolled Students</p>
                          <p className="text-sm font-bold">{(course.enrolledStudents || 0).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col justify-end items-end">
                        <span className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1">Status</span>
                        {course.isActive !== false ? (
                          <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Active
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-error flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-error" /> Inactive
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </KnowledgeCard>
          ))}
        </div>
      )}

      {/* ── MODAL: Create Course ─────────────────────────────────────────────── */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface_container_lowest w-full max-w-lg rounded-2xl shadow-ambient border border-outline_variant/20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-outline_variant/10">
              <h2 className="text-xl font-bold text-on_surface font-manrope">Create New Course</h2>
              <button onClick={() => setIsCreateOpen(false)} className="text-on_surface_variant hover:text-on_surface p-2 rounded-full hover:bg-surface_container_high transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Course Title *</label>
                <input
                  required type="text" value={newCourse.title}
                  onChange={e => setNewCourse({ ...newCourse, title: e.target.value })}
                  className="w-full bg-surface_container_highest border border-outline_variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-on_surface transition-colors"
                  placeholder="e.g. Advanced Machine Learning"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Description</label>
                <textarea
                  value={newCourse.description}
                  onChange={e => setNewCourse({ ...newCourse, description: e.target.value })}
                  rows={3}
                  className="w-full bg-surface_container_highest border border-outline_variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-on_surface transition-colors resize-none"
                  placeholder="Brief overview of what students will learn..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Duration</label>
                  <input
                    type="text" value={newCourse.duration}
                    onChange={e => setNewCourse({ ...newCourse, duration: e.target.value })}
                    className="w-full bg-surface_container_highest border border-outline_variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-on_surface transition-colors"
                    placeholder="e.g. 8 Weeks"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Price (₹)</label>
                  <input
                    type="number" min="0" value={newCourse.price}
                    onChange={e => setNewCourse({ ...newCourse, price: Number(e.target.value), isPaid: Number(e.target.value) > 0 })}
                    className="w-full bg-surface_container_highest border border-outline_variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-on_surface transition-colors"
                    placeholder="0 for free"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-surface_container_high">
                <input
                  type="checkbox" id="isPaid" checked={newCourse.isPaid}
                  onChange={e => setNewCourse({ ...newCourse, isPaid: e.target.checked, price: e.target.checked ? newCourse.price : 0 })}
                  className="w-4 h-4 accent-primary"
                />
                <label htmlFor="isPaid" className="text-sm font-bold text-on_surface cursor-pointer">Mark as Paid Course</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="flex-1 py-2.5 rounded-full font-bold text-sm text-on_surface_variant hover:bg-surface_container_high transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 btn-premium py-2.5 disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Creating...</> : <><Plus className="w-4 h-4" /> Create Course</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Edit Course ───────────────────────────────────────────────── */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface_container_lowest w-full max-w-lg rounded-2xl shadow-ambient border border-outline_variant/20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-outline_variant/10">
              <h2 className="text-xl font-bold text-on_surface font-manrope">Edit Course</h2>
              <button onClick={() => setEditingCourse(null)} className="text-on_surface_variant hover:text-on_surface p-2 rounded-full hover:bg-surface_container_high transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Course Title *</label>
                <input
                  required type="text" value={editForm.title}
                  onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full bg-surface_container_highest border border-outline_variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-on_surface transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className="w-full bg-surface_container_highest border border-outline_variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-on_surface transition-colors resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Duration</label>
                  <input
                    type="text" value={editForm.duration}
                    onChange={e => setEditForm({ ...editForm, duration: e.target.value })}
                    className="w-full bg-surface_container_highest border border-outline_variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-on_surface transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Price (₹)</label>
                  <input
                    type="number" min="0" value={editForm.price}
                    onChange={e => setEditForm({ ...editForm, price: Number(e.target.value), isPaid: Number(e.target.value) > 0 })}
                    className="w-full bg-surface_container_highest border border-outline_variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-on_surface transition-colors"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-surface_container_high">
                <input
                  type="checkbox" id="editIsPaid" checked={editForm.isPaid}
                  onChange={e => setEditForm({ ...editForm, isPaid: e.target.checked })}
                  className="w-4 h-4 accent-primary"
                />
                <label htmlFor="editIsPaid" className="text-sm font-bold text-on_surface cursor-pointer">Paid Course</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingCourse(null)} className="flex-1 py-2.5 rounded-full font-bold text-sm text-on_surface_variant hover:bg-surface_container_high transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 btn-premium py-2.5 disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Confirm Deactivate ────────────────────────────────────────── */}
      {deletingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface_container_lowest w-full max-w-sm rounded-2xl shadow-ambient border border-error/20 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="w-14 h-14 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-5">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-on_surface mb-2 font-manrope">Deactivate Course?</h2>
              <p className="text-sm text-on_surface_variant mb-1">This will hide the course from students:</p>
              <p className="font-bold text-on_surface text-base mb-1">{deletingCourse.title}</p>
              <p className="text-xs text-outline mb-6">The course data is preserved and can be restored at any time.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingCourse(null)}
                  className="flex-1 px-4 py-2.5 rounded-full font-bold text-sm text-on_surface_variant hover:bg-surface_container_high transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-full font-bold text-sm bg-error text-white hover:bg-error/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? <><RefreshCw className="w-3 h-3 animate-spin" /> Processing...</> : "Deactivate"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
