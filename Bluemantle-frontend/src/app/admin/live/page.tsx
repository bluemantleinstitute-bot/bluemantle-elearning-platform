"use client";

import { useEffect, useState } from "react";
import { KnowledgeCard, CardHeader, CardTitle, CardBody } from "@/components/KnowledgeCard";
import { Video, Calendar, Plus, Info, Activity, Clock, Users, ArrowRight, Loader2, Edit2, Trash2, X, RefreshCw, Save } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { db } from "@/lib/db";

interface Batch {
  _id: string;
  name: string;
  teacherId?: {
    _id: string;
    name: string;
    email: string;
  };
  maxStudents: number;
}

interface LiveClass {
  _id: string;
  topic: string;
  batchId: { _id: string; name: string };
  teacherId: { _id: string; name: string; email: string };
  date: string;
  duration: number;
  status: string;
  zoomLink?: string;
  zoomStartUrl?: string;
}

export default function ClassScheduling() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form State
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [topic, setTopic] = useState("");
  const [date, setDate] = useState("");
  const [duration, setDuration] = useState("60");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Edit State
  const [editingClass, setEditingClass] = useState<any>(null);

  const selectedBatch = batches.find((b) => b._id === selectedBatchId);
  const assignedTeacher = selectedBatch?.teacherId;

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [batchesRes, classesRes] = await Promise.all([
        apiRequest("/batches"),
        apiRequest("/classes")
      ]);
      if (batchesRes.success) setBatches(batchesRes.data);
      if (classesRes.success) setLiveClasses(classesRes.data);
    } catch (err: any) {
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedBatchId || !assignedTeacher || !topic || !date) {
      setError("Please fill in all required fields. Make sure the selected batch has an assigned teacher.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await apiRequest("/classes", {
        method: "POST",
        body: JSON.stringify({
          batchId: selectedBatchId,
          teacherId: assignedTeacher._id,
          topic,
          date,
          duration: parseInt(duration, 10) || 60
        })
      });

      if (res.success) {
        setSuccess("Live class scheduled and Zoom meeting created successfully!");
        setTopic("");
        setDate("");
        setSelectedBatchId("");
        setDuration("60");
        fetchData(); // Refresh list
      } else {
        setError(res.message || "Failed to schedule class.");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this scheduled class? This will also cancel the Zoom meeting.")) return;
    try {
      const res = await db.user.deleteLiveClass(id);
      if (res.success) {
        fetchData();
      }
    } catch (err) {
      alert("Error deleting class");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await db.user.updateLiveClass(editingClass._id, editingClass);
      if (res.success) {
        setEditingClass(null);
        fetchData();
      }
    } catch (err) {
      alert("Error updating class");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const activeSessionsThisWeek = liveClasses.filter(c => {
    const d = new Date(c.date);
    const now = new Date();
    const diffTime = Math.abs(d.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays <= 7 && (c.status === 'scheduled' || c.status === 'live');
  }).length;

  return (
    <div className="space-y-8 pb-16">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-manrope font-bold tracking-tight mb-2">Live Class Scheduling</h1>
          <p className="text-on_surface_variant">Manage and coordinate real-time broadcasts across Azure Academy.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Scheduling Form / Info */}
        <div className="lg:col-span-2 space-y-8">
           <KnowledgeCard className="bg-surface_container_low border-primary/20">
              <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                    <Video className="w-5 h-5 text-primary" /> Create New Live Session
                 </CardTitle>
                 <p className="text-xs text-on_surface_variant mt-1 font-medium">Coordinate your next global broadcast.</p>
              </CardHeader>
              <CardBody>
                 <form onSubmit={handleSchedule} className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold uppercase tracking-widest text-outline">Class Title</label>
                         <input 
                           type="text" 
                           required
                           suppressHydrationWarning
                           value={topic}
                           onChange={(e) => setTopic(e.target.value)}
                           className="w-full bg-surface_container_lowest border border-outline_variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50" 
                           placeholder="e.g. Quantum Computing 101" 
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold uppercase tracking-widest text-outline">Select Batch</label>
                         <select 
                           required
                           suppressHydrationWarning
                           value={selectedBatchId}
                           onChange={(e) => setSelectedBatchId(e.target.value)}
                           className="w-full bg-surface_container_lowest border border-outline_variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 appearance-none"
                         >
                            <option value="">Select a Batch</option>
                            {batches.map(b => (
                              <option key={b._id} value={b._id}>{b.name}</option>
                            ))}
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold uppercase tracking-widest text-outline">Assign Faculty</label>
                         <input 
                           type="text" 
                           disabled
                           suppressHydrationWarning
                           value={assignedTeacher ? assignedTeacher.name : "Auto-assigned based on batch"}
                           className="w-full bg-surface_container_highest border border-outline_variant/30 rounded-xl px-4 py-3 text-sm text-on_surface_variant opacity-70 cursor-not-allowed" 
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold uppercase tracking-widest text-outline">Date & Time</label>
                         <input 
                           type="datetime-local" 
                           required
                           suppressHydrationWarning
                           value={date}
                           onChange={(e) => setDate(e.target.value)}
                           className="w-full bg-surface_container_lowest border border-outline_variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50" 
                         />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                         <label className="text-[10px] font-bold uppercase tracking-widest text-outline">Duration (Minutes)</label>
                         <input 
                           type="number" 
                           required
                           suppressHydrationWarning
                           min="15"
                           value={duration}
                           onChange={(e) => setDuration(e.target.value)}
                           className="w-full bg-surface_container_lowest border border-outline_variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50" 
                           placeholder="60" 
                         />
                      </div>
                   </div>
                   
                   {error && <p className="text-error text-sm font-medium">{error}</p>}
                   {success && <p className="text-green-500 text-sm font-medium">{success}</p>}

                   <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex gap-4">
                      <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                         <h5 className="text-sm font-bold text-primary">Scheduling Tip</h5>
                         <p className="text-xs text-on_surface_variant leading-relaxed">
                            Azure Academy recommends scheduling sessions at least 48 hours in advance to ensure student notification systems are triggered correctly. Zoom links are generated automatically.
                         </p>
                      </div>
                   </div>

                   <button 
                     type="submit"
                     disabled={isSubmitting || isLoading}
                     className="w-full bg-primary text-on_primary py-4 rounded-xl font-bold text-sm shadow-ambient hover:opacity-90 transition-opacity disabled:opacity-50 flex justify-center items-center gap-2"
                   >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Broadcast Schedule"}
                   </button>
                  </form>
              </CardBody>
           </KnowledgeCard>

           <div className="space-y-4">
              <h2 className="text-xl font-bold font-manrope text-on_surface mb-4 px-2">Scheduled Live Sessions</h2>
              {isLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
              ) : liveClasses.length === 0 ? (
                <p className="text-on_surface_variant text-sm px-2">No live classes scheduled yet.</p>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                   {liveClasses.map((session) => (
                     <div key={session._id} className="flex flex-col md:flex-row justify-between items-center p-6 bg-surface_container_lowest rounded-2xl border border-outline_variant/10 shadow-sm hover:shadow-ambient transition-all group">
                        <div className="flex gap-4 items-center">
                           <div className="w-12 h-12 rounded-2xl bg-surface_container_high text-primary flex items-center justify-center font-bold">
                              <Calendar className="w-6 h-6" />
                           </div>
                           <div>
                              <h4 className="font-bold text-on_surface">{session.topic}</h4>
                              <p className="text-xs text-on_surface_variant">
                                {session.teacherId?.name || "No Teacher"} • {formatDate(session.date)} at {formatTime(session.date)}
                              </p>
                              <p className="text-xs text-primary mt-0.5">Batch: {session.batchId?.name || "Unknown"}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-4 mt-4 md:mt-0">
                           <div className="text-right mr-2">
                              <span className={`text-[10px] font-bold uppercase tracking-widest ${session.status === 'live' ? 'text-green-500' : session.status === 'recorded' ? 'text-outline' : 'text-primary'}`}>
                                 {session.status}
                              </span>
                           </div>
                           
                           <button 
                             onClick={() => setEditingClass(session)}
                             className="p-2 hover:bg-surface_container_high rounded-lg text-outline hover:text-primary transition-colors"
                           >
                              <Edit2 className="w-4 h-4" />
                           </button>
                           <button 
                             onClick={() => handleDelete(session._id)}
                             className="p-2 hover:bg-surface_container_high rounded-lg text-outline hover:text-error transition-colors"
                           >
                              <Trash2 className="w-4 h-4" />
                           </button>

                           {session.zoomStartUrl ? (
                             <a href={session.zoomStartUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-surface_container_highest hover:bg-primary/20 hover:text-primary rounded-full transition-colors" title="Start Meeting (Teacher)">
                                <Video className="w-5 h-5 text-green-500" />
                             </a>
                           ) : session.zoomLink ? (
                             <a href={session.zoomLink} target="_blank" rel="noopener noreferrer" className="p-2 bg-surface_container_highest hover:bg-primary/20 hover:text-primary rounded-full transition-colors" title="Join Meeting">
                                <Video className="w-5 h-5 text-primary" />
                             </a>
                           ) : null}
                        </div>
                     </div>
                   ))}
                </div>
              )}
           </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
           <KnowledgeCard className="p-8">
              <div className="flex gap-4 items-center mb-6">
                 <div className="p-3 rounded-xl bg-surface_container_high text-secondary">
                    <Activity className="w-6 h-6" />
                 </div>
                 <h4 className="font-manrope font-bold text-lg leading-tight">Capacity Insights</h4>
              </div>
              <div className="space-y-6">
                 <div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-outline mb-2">
                       <span>Teacher Bandwidth</span>
                       <span>Active utilization</span>
                    </div>
                    <div className="h-1.5 bg-surface_container_highest rounded-full overflow-hidden">
                       <div className="h-full bg-secondary" style={{ width: '65%' }} />
                    </div>
                 </div>
                 <div className="pt-4 border-t border-outline_variant/10">
                    <div className="flex justify-between items-center">
                       <p className="text-sm font-bold text-on_surface">{activeSessionsThisWeek} Active Sessions</p>
                       <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">This Week</span>
                    </div>
                 </div>
              </div>
           </KnowledgeCard>

           <div className="p-6 rounded-2xl bg-secondary/5 border border-secondary/20">
              <div className="flex gap-4 items-start">
                 <Clock className="w-5 h-5 text-secondary mt-0.5" />
                 <div>
                    <h4 className="text-sm font-bold text-on_surface">Auto-Notification</h4>
                    <p className="text-xs text-on_surface_variant mt-1 leading-relaxed">
                       Once a session is confirmed, calendar invites and SMS reminders are automatically dispatched to all enrolled students.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <div className="bg-surface_container_lowest w-full max-w-lg rounded-3xl shadow-ambient border border-outline_variant/20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center p-8 border-b border-outline_variant/10">
                 <h2 className="text-2xl font-bold text-on_surface font-manrope">Update Broadcast Schedule</h2>
                 <button onClick={() => setEditingClass(null)} className="text-on_surface_variant hover:text-on_surface p-2 rounded-full hover:bg-surface_container_high transition-colors">
                    <X className="w-5 h-5" />
                 </button>
              </div>
              <form onSubmit={handleUpdate} className="p-8 space-y-6">
                 <div>
                    <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Session Topic</label>
                    <input 
                       required
                       type="text"
                       value={editingClass.topic}
                       onChange={e => setEditingClass({...editingClass, topic: e.target.value})}
                       className="w-full bg-surface_container_high border border-outline_variant/30 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-primary/50 text-on_surface"
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Date & Time</label>
                       <input 
                          required
                          type="datetime-local"
                          value={new Date(new Date(editingClass.date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                          onChange={e => setEditingClass({...editingClass, date: e.target.value})}
                          className="w-full bg-surface_container_high border border-outline_variant/30 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-primary/50 text-on_surface"
                       />
                    </div>
                    <div>
                       <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Duration (Mins)</label>
                       <input 
                          required
                          type="number"
                          value={editingClass.duration}
                          onChange={e => setEditingClass({...editingClass, duration: parseInt(e.target.value)})}
                          className="w-full bg-surface_container_high border border-outline_variant/30 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-primary/50 text-on_surface"
                       />
                    </div>
                 </div>
                 <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setEditingClass(null)} className="flex-1 py-4 rounded-2xl font-bold text-sm text-on_surface_variant hover:bg-surface_container_high transition-colors">
                       Cancel
                    </button>
                    <button type="submit" disabled={isSubmitting} className="flex-1 bg-primary text-on_primary py-4 rounded-2xl font-bold text-sm shadow-ambient hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                       {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                       Update Class
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
