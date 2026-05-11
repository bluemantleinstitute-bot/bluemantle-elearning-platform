"use client";

import type { ComponentType, SVGProps } from "react";
import { useEffect, useState } from "react";
import { KnowledgeCard, CardHeader, CardTitle, CardBody } from "@/components/KnowledgeCard";
import { MessageSquare, Check, X, Clock, AlertCircle, Inbox, CheckCircle2, Star, RefreshCw } from "lucide-react";
import { db } from "@/lib/db";

type DoubtStatus = "Pending" | "In Review" | "Resolved";

const TABS: { key: DoubtStatus; label: string; icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { key: "Pending",   label: "New Arrivals", icon: Inbox        },
  { key: "In Review", label: "In Review",    icon: Clock        },
  { key: "Resolved",  label: "Answered",     icon: CheckCircle2 },
];

export default function TeacherQAPage() {
  const [doubts, setDoubts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<DoubtStatus>("Pending");
  const [activeDoubt, setActiveDoubt] = useState<any | null>(null);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDoubts();
  }, []);

  const fetchDoubts = async () => {
    try {
      setLoading(true);
      const data = await db.user.getAllDoubts();
      setDoubts(data || []);
    } catch (error) {
      console.error("Failed to fetch doubts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDoubt || !response.trim()) return;
    
    try {
      setSubmitting(true);
      await db.user.respondToDoubt(activeDoubt._id, { 
        answer: response, 
        status: "Resolved" 
      });
      setResponse("");
      setActiveDoubt(null);
      await fetchDoubts();
      setActiveTab("Resolved");
    } catch (error) {
      console.error("Failed to resolve doubt:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const visibleDoubts = doubts.filter(d => d.status === activeTab);

  const counts = {
    Pending:   doubts.filter(d => d.status === "Pending").length,
    "In Review": doubts.filter(d => d.status === "In Review").length,
    Resolved:  doubts.filter(d => d.status === "Resolved").length,
  };

  if (loading) return (
    <div className="p-20 text-center">
      <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
      <p className="text-on_surface_variant animate-pulse font-medium">Synchronizing Doubts Inbox...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-manrope font-bold tracking-tight mb-2">Student Doubts Inbox</h1>
          <p className="text-on_surface_variant max-w-2xl text-sm italic">
            "Direct wisdom to inquisitive minds."
          </p>
        </div>
        {/* Quick Stats */}
        <div className="flex gap-3 flex-shrink-0">
          <div className="text-center px-4 py-2 bg-error/10 border border-error/20 rounded-xl">
            <p className="text-[10px] font-bold text-outline uppercase tracking-wider">New</p>
            <p className="text-lg font-extrabold font-manrope text-error">{counts.Pending}</p>
          </div>
          <div className="text-center px-4 py-2 bg-secondary/10 border border-secondary/20 rounded-xl">
            <p className="text-[10px] font-bold text-outline uppercase tracking-wider">In Review</p>
            <p className="text-lg font-extrabold font-manrope text-secondary">{counts["In Review"]}</p>
          </div>
          <div className="text-center px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl">
            <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Resolved</p>
            <p className="text-lg font-extrabold font-manrope text-primary">{counts.Resolved}</p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-outline_variant/20 pb-0">
        {TABS.map(tab => {
          const Icon = tab.icon;

          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setActiveDoubt(null); }}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-bold rounded-t-xl border-b-2 transition-all ${
                activeTab === tab.key
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-on_surface_variant hover:text-on_surface hover:bg-surface_container_high"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key ? "bg-primary text-on_primary" : "bg-outline_variant/30 text-outline"
              }`}>
                {counts[tab.key]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left: Doubt Cards */}
        <div className="space-y-4">
          {visibleDoubts.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-outline_variant/30 rounded-2xl bg-surface_container_low">
              <Check className="w-8 h-8 text-secondary mx-auto mb-3" />
              <p className="text-sm font-bold text-on_surface">No doubts here</p>
              <p className="text-xs text-on_surface_variant mt-1">This section is clear.</p>
            </div>
          ) : (
            visibleDoubts.map(doubt => (
              <div
                key={doubt._id}
                onClick={() => setActiveDoubt(doubt)}
                className={`p-5 border cursor-pointer rounded-2xl transition-all ${
                  activeDoubt?._id === doubt._id
                    ? "border-primary shadow-ambient bg-surface_container_highest"
                    : "border-outline_variant/20 bg-surface_container_low hover:border-primary/50"
                }`}
              >
                {/* Subject tag + date */}
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-sm">
                    {doubt.subject}
                  </span>
                  <span className="text-[10px] text-outline">{new Date(doubt.createdAt).toLocaleDateString()}</span>
                </div>

                {/* Student Info */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold flex items-center justify-center flex-shrink-0">
                    {doubt.studentId?.name?.charAt(0) || "S"}
                  </div>
                  <div>
                    <p className="font-bold text-on_surface text-sm leading-none">{doubt.studentId?.name}</p>
                    <p className="text-[10px] text-outline tracking-widest uppercase">{doubt.studentId?.email?.split('@')[0]}</p>
                  </div>
                </div>

                <p className="text-xs text-on_surface_variant line-clamp-2 leading-relaxed mt-2">
                  {doubt.question}
                </p>

                {/* Priority / Status badge */}
                <div className="mt-3 flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest ${
                    doubt.priority === 'High' ? 'bg-error/10 text-error' : 
                    doubt.priority === 'Medium' ? 'bg-secondary/10 text-secondary' : 
                    'bg-outline/10 text-outline'
                  }`}>
                    {doubt.priority} Priority
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right: Resolution / View Panel */}
        <div className="lg:col-span-2">
          {activeDoubt ? (
            <KnowledgeCard className="border-primary/20 sticky top-24">
              <CardHeader className="border-b border-outline_variant/10 pb-5 mb-5">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Query Filed By</p>
                    <CardTitle className="text-xl">{activeDoubt.studentId?.name}</CardTitle>
                    {/* Rich metadata */}
                    <div className="flex gap-3 flex-wrap pt-1">
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded tracking-widest uppercase">{activeDoubt.studentId?.email?.split('@')[0]}</span>
                      <span className="text-[10px] text-outline font-bold">Submitted: {new Date(activeDoubt.createdAt).toLocaleString()}</span>
                      {activeDoubt.resolvedAt && (
                        <span className="text-[10px] text-primary font-bold">Resolved: {new Date(activeDoubt.resolvedAt).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setActiveDoubt(null)} className="p-2 rounded-full hover:bg-surface_container_high text-outline transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </CardHeader>
              <CardBody className="space-y-6">
                {/* The Question */}
                <div className="bg-surface_container_highest border border-outline_variant/20 p-5 rounded-2xl">
                  <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> The Doubt · {activeDoubt.subject}
                  </p>
                  <p className="text-on_surface text-sm leading-relaxed font-medium">
                    "{activeDoubt.question}"
                  </p>
                </div>

                {/* If Resolved: show existing answer */}
                {activeDoubt.status === "Resolved" && activeDoubt.answer ? (
                  <div className="bg-primary/5 border border-primary/20 p-5 rounded-2xl">
                    <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Star className="w-4 h-4" /> Your Resolution
                    </p>
                    <p className="text-on_surface text-sm leading-relaxed">{activeDoubt.answer}</p>
                  </div>
                ) : (
                  /* If not resolved: show form */
                  <form onSubmit={handleResolve} className="space-y-4">
                    <label className="block text-xs font-bold text-outline uppercase tracking-wider">Compose Resolution</label>
                    <textarea
                      value={response}
                      onChange={e => setResponse(e.target.value)}
                      placeholder="Draft your comprehensive response here..."
                      rows={7}
                      className="w-full bg-surface_container_low border border-outline_variant/30 rounded-xl p-4 text-sm focus:outline-none focus:border-primary/50 transition-colors resize-none"
                    />
                    <div className="flex justify-end pt-2">
                      <button 
                        type="submit" 
                        disabled={!response.trim() || submitting} 
                        className="bg-primary text-on_primary px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                      >
                        {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Resolve & Log to Record
                      </button>
                    </div>
                  </form>
                )}
              </CardBody>
            </KnowledgeCard>
          ) : (
            <div className="h-[420px] flex flex-col items-center justify-center text-center p-12 border border-dashed border-outline_variant/20 rounded-3xl bg-surface_container_low/50">
              <div className="w-16 h-16 rounded-3xl bg-surface_container_highest text-outline flex items-center justify-center mb-6">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold font-manrope text-on_surface mb-2">Select a Query</h3>
              <p className="text-sm text-on_surface_variant max-w-xs">
                Pick a doubt from the queue to view details, compose your response, and log the resolution to your performance record.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
