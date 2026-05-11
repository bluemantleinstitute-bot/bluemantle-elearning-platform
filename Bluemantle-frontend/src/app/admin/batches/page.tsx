"use client";

import { useState, useMemo, useEffect } from "react";
import { KnowledgeCard, CardHeader, CardTitle, CardBody } from "@/components/KnowledgeCard";
import { DataTable } from "@/components/DataTable";
import { 
  Layers, Users, Star, TrendingUp, Activity, 
  Search, Filter, ArrowLeft, GraduationCap, 
  ShieldAlert, Clock, CheckCircle2, AlertCircle,
  BarChart3, MessageSquareWarning, ExternalLink,
  Plus, X, Save, Edit3, Trash2
} from "lucide-react";
import { db } from "@/lib/db";



export default function AdminBatchesPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [selectedBatchData, setSelectedBatchData] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"Students" | "Faculty" | "Grievances">("Students");
  
  // New states for Create/Edit
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    courseId: "",
    maxStudents: 100,
    endDate: ""
  });


  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [batchesData, coursesData, teachersData, studentsData] = await Promise.all([
          db.user.getBatches(),
          db.user.getCatalog(),
          db.user.getUsers("teacher"),
          db.user.getUsers("student")
        ]);
        setBatches(batchesData);
        setCourses(coursesData);
        setTeachers(teachersData);
        setAvailableStudents(studentsData);
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);


  // Fetch specific batch details when selected
  useEffect(() => {
    if (selectedBatchId) {
      const fetchDetails = async () => {
        try {
          const data = await db.user.getBatchDetails(selectedBatchId);
          setSelectedBatchData(data);
          // Set form data for editing
          setFormData({
            name: data.name,
            courseId: data.courseId?._id || "",
            maxStudents: data.maxStudents,
            endDate: data.endDate ? new Date(data.endDate).toISOString().split('T')[0] : ""
          });
        } catch (error) {
          console.error("Failed to fetch batch details:", error);
        }
      };
      fetchDetails();
    } else {
      setSelectedBatchData(null);
      setIsEditing(false);
    }
  }, [selectedBatchId]);

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await db.user.createBatch(formData);
      const updatedBatches = await db.user.getBatches();
      setBatches(updatedBatches);
      setShowCreateModal(false);
      setFormData({ name: "", courseId: "", maxStudents: 100, endDate: "" });
    } catch (error) {
      console.error("Failed to create batch:", error);
      alert("Failed to create batch");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBatch = async () => {
    if (!selectedBatchId) return;
    try {
      setSaving(true);
      await db.user.updateBatch(selectedBatchId, formData);
      const data = await db.user.getBatchDetails(selectedBatchId);
      setSelectedBatchData(data);
      setIsEditing(false);
      // Refresh list too
      const updatedBatches = await db.user.getBatches();
      setBatches(updatedBatches);
    } catch (error) {
      console.error("Failed to update batch:", error);
      alert("Failed to update batch");
    } finally {
      setSaving(false);
    }
  };

  const handleAssignTeacher = async (teacherId: string) => {
    if (!selectedBatchId) return;
    try {
      setSaving(true);
      await db.user.assignTeacherToBatch(selectedBatchId, teacherId);
      const data = await db.user.getBatchDetails(selectedBatchId);
      setSelectedBatchData(data);
    } catch (error) {
      console.error("Failed to assign teacher:", error);
      alert("Failed to assign teacher");
    } finally {
      setSaving(false);
    }
  };

  const handleAddStudent = async (studentId: string) => {
    if (!selectedBatchId) return;
    try {
      setSaving(true);
      await db.user.addStudentsToBatch(selectedBatchId, [studentId]);
      const data = await db.user.getBatchDetails(selectedBatchId);
      setSelectedBatchData(data);
    } catch (error) {
      console.error("Failed to add student:", error);
      alert("Failed to add student");
    } finally {
      setSaving(false);
    }
  };



  if (loading) return <div className="p-20 text-center animate-pulse text-on_surface_variant">Scanning Batch Clusters...</div>;

  if (selectedBatchId && selectedBatchData) {
    const batch = selectedBatchData;
    const students = batch.students || [];

    return (
      <div className="space-y-8 pb-16 animate-in slide-in-from-right-4 duration-500">
         <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
               <button 
                 onClick={() => setSelectedBatchId(null)}
                 className="p-2.5 bg-surface_container_high rounded-full hover:bg-surface_container_highest transition-all"
               >
                  <ArrowLeft className="w-5 h-5" />
               </button>
               <div>
                   <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-widest">{batch._id.slice(-6)}</span>
                      {isEditing ? (
                        <input 
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="bg-surface_container_low border-b-2 border-primary outline-none px-2 py-1 text-2xl font-bold font-manrope w-full max-w-md"
                        />
                      ) : (
                        <h1 className="text-3xl font-manrope font-bold tracking-tight">{batch.name}</h1>
                      )}
                   </div>

                  <p className="text-on_surface_variant text-sm flex items-center gap-2">
                     <GraduationCap className="w-4 h-4" /> Instructor: <span className="font-bold text-on_surface">{batch.teacherId?.name || "Unassigned"}</span>
                  </p>
               </div>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
               {isEditing ? (
                 <>
                   <button 
                     onClick={() => setIsEditing(false)}
                     className="flex-1 sm:flex-none px-4 py-2 text-sm font-bold bg-surface_container_highest rounded-xl hover:bg-surface_container_highest/80 transition-all"
                   >
                     Cancel
                   </button>
                   <button 
                     onClick={handleUpdateBatch}
                     disabled={saving}
                     className="flex-1 sm:flex-none btn-premium gap-2 scale-90 sm:scale-100 disabled:opacity-50"
                   >
                     <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
                   </button>
                 </>
               ) : (
                 <button 
                   onClick={() => setIsEditing(true)}
                   className="flex-1 sm:flex-none btn-premium gap-2 scale-90 sm:scale-100"
                 >
                    <Edit3 className="w-4 h-4" /> Edit Batch
                 </button>
               )}
            </div>

         </header>

          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {isEditing ? (
               <>
                 <KnowledgeCard className="p-4">
                   <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-2">Max Students</p>
                   <input 
                     type="number"
                     value={formData.maxStudents}
                     onChange={(e) => setFormData({...formData, maxStudents: parseInt(e.target.value)})}
                     className="bg-surface_container_low border-b border-primary outline-none px-2 py-1 text-xl font-extrabold font-manrope w-full"
                   />
                 </KnowledgeCard>
                 <KnowledgeCard className="p-4">
                   <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-2">End Date</p>
                   <input 
                     type="date"
                     value={formData.endDate}
                     onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                     className="bg-surface_container_low border-b border-primary outline-none px-2 py-1 text-sm font-bold w-full"
                   />
                 </KnowledgeCard>
               </>
             ) : (
               [
                 { label: "Enrollment",   value: `${students.length}/${batch.maxStudents}`, icon: Users, color: "text-primary" },
                 { label: "Attendance",   value: "92%", icon: Activity, color: "text-secondary" },
                 { label: "Completion",   value: "75%", icon: BarChart3, color: "text-primary" },
                 { label: "Grievances",   value: "0", icon: ShieldAlert, color: "text-outline" },
               ].map(s => (
                 <KnowledgeCard key={s.label} className="p-4">
                    <div className="flex gap-3 items-center">
                       <div className={`p-2 rounded-lg bg-surface_container_high ${s.color}`}>
                          <s.icon className="w-4 h-4" />
                       </div>
                       <div>
                          <p className="text-[10px] font-bold text-outline uppercase tracking-wider">{s.label}</p>
                          <p className={`text-xl font-extrabold font-manrope ${s.color}`}>{s.value}</p>
                       </div>
                    </div>
                 </KnowledgeCard>
               ))
             )}
          </section>


         <div className="flex gap-2 border-b border-outline_variant/10">
            {(["Students", "Faculty", "Grievances"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${
                  activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-outline hover:text-on_surface'
                }`}
              >
                {tab}
              </button>
            ))}
         </div>

         <div className="animate-in fade-in duration-300">
            {activeTab === "Students" && (
              <div className="space-y-6">
                {isEditing && (
                  <KnowledgeCard className="p-6 bg-primary/5 border-primary/20">
                    <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Enroll New Students
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <select 
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddStudent(e.target.value);
                            e.target.value = "";
                          }
                        }}
                        className="w-full bg-surface_container_low border border-outline_variant/30 rounded-xl px-4 py-3 outline-none focus:border-primary transition-all font-bold appearance-none"
                      >
                         <option value="">Select Student to Enroll...</option>
                         {availableStudents
                           .filter(s => !students.some((enrolled: any) => enrolled._id === s.id))
                           .map(s => (
                             <option key={s.id} value={s.id}>{s.name} ({s.userId})</option>
                           ))
                         }
                      </select>
                      <p className="text-xs text-outline font-bold flex items-center px-2">
                        Only students not currently enrolled in this cluster are displayed.
                      </p>
                    </div>
                  </KnowledgeCard>
                )}
                <KnowledgeCard>
                   <CardBody className="p-0">
                      <DataTable 
                        data={students}
                        columns={[
                          { key: "name", header: "Student", render: (v, r) => (
                            <div>
                              <p className="font-bold text-on_surface">{v}</p>
                              <p className="text-[10px] text-outline font-bold">{r.signInId}</p>
                            </div>
                          )},
                          { key: "email", header: "Email Address" },
                          { key: "attendance", header: "Attendance", render: () => <span className="font-bold">--%</span> },
                          { key: "progress", header: "Course Progress", render: () => (
                             <div className="flex items-center gap-2">
                               <div className="w-16 h-1.5 bg-surface_container_high rounded-full overflow-hidden">
                                  <div className="h-full bg-primary" style={{ width: `0%` }} />
                               </div>
                               <span className="text-xs font-bold">0%</span>
                             </div>
                          )},
                          { key: "status", header: "State", render: () => <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">Active</span> }
                        ]}
                      />
                   </CardBody>
                </KnowledgeCard>
              </div>
            )}


            {activeTab === "Faculty" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {isEditing ? (
                   <KnowledgeCard className="p-6">
                      <h3 className="text-sm font-bold text-outline uppercase tracking-widest mb-4">Assign Instructor</h3>
                      <select 
                        onChange={(e) => handleAssignTeacher(e.target.value)}
                        value={batch.teacherId?._id || ""}
                        className="w-full bg-surface_container_low border border-outline_variant/30 rounded-xl px-4 py-3 outline-none focus:border-primary transition-all font-bold appearance-none"
                      >
                         <option value="">Select Teacher...</option>
                         {teachers.map(t => (
                           <option key={t.id} value={t.id}>{t.name} ({t.userId})</option>
                         ))}
                      </select>
                   </KnowledgeCard>
                 ) : batch.teacherId ? (
                   <KnowledgeCard className="p-6">
                      <div className="flex items-center gap-4 mb-6">
                         <div className="w-16 h-16 rounded-2xl bg-signature-gradient text-on_primary flex items-center justify-center text-2xl font-bold">
                            {batch.teacherId.name.split(' ').map((n:any)=>n[0]).join('')}
                         </div>
                         <div>
                            <h3 className="text-xl font-bold font-manrope">{batch.teacherId.name}</h3>
                            <p className="text-xs text-outline font-bold uppercase tracking-widest">{batch.teacherId.signInId} · Lead Instructor</p>
                         </div>
                      </div>
                      <div className="space-y-4">
                         <div className="flex justify-between p-3 bg-surface_container_low rounded-xl">
                            <span className="text-xs font-bold text-on_surface_variant">Email</span>
                            <span className="text-xs font-bold">{batch.teacherId.email}</span>
                         </div>
                      </div>
                   </KnowledgeCard>
                 ) : (
                    <KnowledgeCard className="p-8 bg-surface_container_low flex flex-col justify-center items-center text-center border-dashed">
                      <div className="p-3 bg-outline_variant/20 text-outline rounded-full mb-4">
                        <Users className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-on_surface">No Instructor Assigned</p>
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="text-xs font-bold text-primary hover:underline mt-2"
                      >
                        Assign Lead Instructor
                      </button>
                    </KnowledgeCard>
                 )}
              </div>
            )}


            {activeTab === "Grievances" && (
              <div className="p-20 text-center bg-surface_container_low rounded-2xl border border-dashed border-outline_variant">
                 <CheckCircle2 className="w-10 h-10 text-primary/30 mx-auto mb-4" />
                 <p className="text-sm font-bold text-on_surface">Zero Active Grievances</p>
                 <p className="text-xs text-outline mt-1">This cohort is currently clear of internal administrative issues.</p>
              </div>
            )}
         </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-manrope font-bold tracking-tight mb-2">Academic Batch Intelligence</h1>
          <p className="text-on_surface_variant max-w-2xl text-sm italic">
            "Observe. Evaluate. Calibrate. The core of institutional excellence lies in the cluster."
          </p>
        </div>
         <div className="flex gap-3">
            <button 
              onClick={() => setShowCreateModal(true)}
              className="btn-premium gap-2"
            >
               <Layers className="w-4 h-4" /> Provision New Batch
            </button>
         </div>

      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {batches.map(b => (
           <div 
             key={b._id}
             onClick={() => setSelectedBatchId(b._id)}
             className="group relative cursor-pointer"
           >
              <KnowledgeCard className="h-full border-outline_variant/20 hover:border-primary/50 hover:shadow-ambient transition-all overflow-hidden">
                 <div className="h-1 w-full bg-surface_container_highest">
                    <div className="h-full bg-primary" style={{ width: '100%' }} />
                 </div>
                 
                 <CardBody className="p-6">
                    <div className="flex justify-between items-start mb-4">
                       <span className="text-[10px] font-bold text-outline uppercase tracking-widest">{b._id.slice(-6)}</span>
                       <div className="p-2 bg-primary/10 text-primary rounded-lg opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all">
                          <Activity className="w-4 h-4" />
                       </div>
                    </div>

                    <h2 className="text-xl font-bold font-manrope mb-1 text-on_surface group-hover:text-primary transition-colors">{b.name}</h2>
                    <p className="text-xs text-outline font-bold mb-6 flex items-center gap-1.5">
                       <GraduationCap className="w-3.5 h-3.5" /> {b.teacherId?.name || "Unassigned"}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                       <div>
                          <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1">Vitality</p>
                          <p className="font-bold text-sm text-on_surface">Active</p>
                       </div>
                       <div>
                          <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1">Saturation</p>
                          <p className="font-bold text-sm text-on_surface">
                             {b.students?.length || 0}/{b.maxStudents} Capacity
                          </p>
                       </div>
                    </div>

                    <div className="pt-4 border-t border-outline_variant/10 flex justify-between items-center">
                       <div className="flex items-center gap-2">
                          <TrendingUp className="w-3.5 h-3.5 text-primary" />
                          <span className="text-[10px] font-bold text-primary uppercase">{b.courseId?.title || "No Course"}</span>
                       </div>
                       <button className="text-[10px] font-black uppercase text-outline group-hover:text-primary transition-colors flex items-center gap-1">
                          Cluster Intelligence <ExternalLink className="w-2.5 h-2.5" />
                       </button>
                    </div>
                 </CardBody>
              </KnowledgeCard>
           </div>
         ))}
      </div>
      {/* Create Batch Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
           <KnowledgeCard className="w-full max-w-lg shadow-2xl border-primary/20">
              <CardHeader className="flex flex-row justify-between items-center">
                 <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5 text-primary" /> Provision New Cluster
                 </CardTitle>
                 <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-surface_container_high rounded-full transition-all">
                    <X className="w-5 h-5" />
                 </button>
              </CardHeader>
              <CardBody className="p-6">
                 <form onSubmit={handleCreateBatch} className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-outline uppercase tracking-widest">Cluster Name</label>
                       <input 
                         required
                         type="text"
                         placeholder="e.g. Alpha-7 June Intake"
                         value={formData.name}
                         onChange={(e) => setFormData({...formData, name: e.target.value})}
                         className="w-full bg-surface_container_low border border-outline_variant/30 rounded-xl px-4 py-3 outline-none focus:border-primary transition-all font-bold"
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-outline uppercase tracking-widest">Select Course Pathway</label>
                       <select 
                         required
                         value={formData.courseId}
                         onChange={(e) => setFormData({...formData, courseId: e.target.value})}
                         className="w-full bg-surface_container_low border border-outline_variant/30 rounded-xl px-4 py-3 outline-none focus:border-primary transition-all font-bold appearance-none"
                       >
                          <option value="">Choose Course...</option>
                          {courses.map(c => (
                            <option key={c._id} value={c._id}>{c.title}</option>
                          ))}
                       </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold text-outline uppercase tracking-widest">Max Saturation</label>
                          <input 
                            type="number"
                            value={formData.maxStudents}
                            onChange={(e) => setFormData({...formData, maxStudents: parseInt(e.target.value)})}
                            className="w-full bg-surface_container_low border border-outline_variant/30 rounded-xl px-4 py-3 outline-none focus:border-primary transition-all font-bold"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold text-outline uppercase tracking-widest">Decommission Date</label>
                          <input 
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                            className="w-full bg-surface_container_low border border-outline_variant/30 rounded-xl px-4 py-3 outline-none focus:border-primary transition-all font-bold"
                          />
                       </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={saving}
                      className="w-full btn-premium py-4 rounded-xl font-bold flex justify-center items-center gap-2 disabled:opacity-50"
                    >
                       {saving ? "Provisioning..." : "Finalize Cluster Initialization"}
                    </button>
                 </form>
              </CardBody>
           </KnowledgeCard>
        </div>
      )}
    </div>
  );
}


