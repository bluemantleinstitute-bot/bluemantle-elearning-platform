"use client";

import { useEffect, useState } from "react";
import { KnowledgeCard, CardHeader, CardTitle, CardBody } from "@/components/KnowledgeCard";
import { MessageSquare, Send, CheckCircle2, Clock, AlertCircle, HelpCircle } from "lucide-react";
import { db } from "@/lib/db";

export default function QAPage() {
  const [doubts, setDoubts] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subject, setSubject] = useState("");
  const [question, setQuestion] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [priority, setPriority] = useState("Low");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchDoubts();
    fetchTeachers();
  }, []);

  const fetchDoubts = async () => {
    try {
      const data = await db.user.getMyDoubts();
      setDoubts(data);
    } catch (error) {
      console.error("Failed to fetch doubts:", error);
    } finally {
      setFetching(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const data = await db.user.getTeachers();
      setTeachers(data || []);
    } catch (error) {
      console.error("Failed to fetch teachers:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !question) return;
    
    setLoading(true);
    try {
      await db.user.submitDoubt({ 
        subject, 
        question, 
        instructorId: instructorId || undefined, 
        priority 
      });
      setSubject("");
      setQuestion("");
      setInstructorId("");
      setPriority("Low");
      fetchDoubts();
    } catch (error) {
      console.error("Failed to submit doubt:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 pb-16 animate-in fade-in duration-500">
      <header>
        <h1 className="text-4xl font-manrope font-bold tracking-tight mb-2">Doubt Resolution Center</h1>
        <p className="text-on_surface_variant">Direct channel to our academic experts</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Ask a Question */}
        <div className="lg:col-span-1">
          <KnowledgeCard className="sticky top-10 shadow-ambient border-primary/10">
            <CardHeader className="bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <CardTitle>Inquiry Terminal</CardTitle>
              </div>
            </CardHeader>
            <CardBody className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-outline mb-2">Subject Area</label>
                  <input 
                    type="text" 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Risk Management"
                    className="w-full bg-surface_container_high text-on_surface rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary transition-all border border-transparent shadow-sm"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-outline mb-2">Instructor</label>
                    <select 
                      value={instructorId}
                      onChange={(e) => setInstructorId(e.target.value)}
                      className="w-full bg-surface_container_high text-on_surface rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary transition-all border border-transparent shadow-sm"
                    >
                      <option value="">Any Expert</option>
                      {teachers.map(t => (
                        <option key={t._id} value={t._id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-outline mb-2">Priority</label>
                    <select 
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full bg-surface_container_high text-on_surface rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary transition-all border border-transparent shadow-sm"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-outline mb-2">Your Detailed Question</label>
                  <textarea 
                    rows={4}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Describe your doubt in detail..."
                    className="w-full bg-surface_container_high text-on_surface rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary transition-all border border-transparent resize-none shadow-sm"
                    required
                  />
                </div>
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-signature-gradient text-on_primary py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-ambient"
                >
                  {loading ? "Transmitting..." : <><Send className="w-4 h-4" /> Broadcast Inquiry</>}
                </button>
              </form>
            </CardBody>
          </KnowledgeCard>
        </div>

        {/* Previous Inquiries */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-xl font-manrope font-bold text-on_surface">Inquiry History</h2>
            <span className="text-xs font-bold text-outline">{doubts.length} TOTAL SESSIONS</span>
          </div>

          {fetching ? (
            <div className="p-20 text-center animate-pulse text-outline italic">Accessing Archives...</div>
          ) : doubts.length === 0 ? (
            <div className="p-20 text-center bg-surface_container_low rounded-3xl border-2 border-dashed border-outline_variant/30">
               <MessageSquare className="w-12 h-12 text-outline/30 mx-auto mb-4" />
               <p className="text-on_surface_variant font-medium">No active inquiries found in this sector.</p>
            </div>
          ) : (
            doubts.map((doubt) => (
              <KnowledgeCard key={doubt._id} className="overflow-hidden border-outline_variant/20 hover:border-primary/30 transition-colors">
                <div className="flex">
                  <div className={`w-1.5 ${doubt.status === 'Resolved' ? 'bg-primary' : doubt.status === 'In Review' ? 'bg-secondary' : 'bg-outline_variant'}`} />
                  <div className="flex-1 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary px-2 py-1 bg-primary/10 rounded-md">
                          {doubt.subject}
                        </span>
                        <h3 className="text-lg font-manrope font-bold mt-2 text-on_surface">{doubt.question}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-tighter text-on_surface_variant bg-surface_container_high px-3 py-1.5 rounded-full whitespace-nowrap">
                        {doubt.status === 'Resolved' ? <CheckCircle2 className="w-3 h-3 text-primary" /> : <Clock className="w-3 h-3" />}
                        {doubt.status}
                      </div>
                    </div>

                    {doubt.answer && (
                      <div className="mt-6 p-5 rounded-2xl bg-surface_container_highest/30 border border-outline_variant/10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                          <MessageSquare className="w-8 h-8" />
                        </div>
                        <p className="text-xs font-bold text-outline uppercase tracking-widest mb-2 flex items-center gap-2">
                           <AlertCircle className="w-3 h-3 text-primary" /> Expert Resolution
                        </p>
                        <p className="text-on_surface leading-relaxed text-sm">{doubt.answer}</p>
                        <div className="mt-4 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[8px] font-bold">
                            {doubt.instructorId?.name?.charAt(0) || "AV"}
                          </div>
                          <p className="text-[10px] text-on_surface_variant">Resolved by <strong>{doubt.instructorId?.name || "Senior Faculty"}</strong> · {new Date(doubt.resolvedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )}
                    
                    {!doubt.answer && (
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] text-outline italic">
                          <Clock className="w-3 h-3" />
                          Awaiting expert analysis.
                        </div>
                        <span className="text-[10px] text-outline">{new Date(doubt.createdAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </KnowledgeCard>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
