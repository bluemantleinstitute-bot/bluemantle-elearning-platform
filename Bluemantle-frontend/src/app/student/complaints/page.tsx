"use client";

import { useState } from "react";
import { KnowledgeCard, CardHeader, CardTitle, CardBody } from "@/components/KnowledgeCard";
import { 
  ShieldAlert, Send, Clock, CheckCircle2, AlertCircle, 
  History, LifeBuoy, Fingerprint, Lock, EyeOff 
} from "lucide-react";

type Grievance = {
  id: string;
  category: string;
  subject: string;
  description: string;
  status: "Pending" | "Reviewed" | "Escalated";
  timestamp: string;
};

const CATEGORIES = [
  "Instructional Quality",
  "Infrastructure / Lab Issues",
  "Technical Support",
  "Batch Management",
  "Other"
];

export default function StudentComplaintPage() {
  const [grievances, setGrievances] = useState<Grievance[]>([
    { 
      id: "GRV-1024", 
      category: "Instructional Quality", 
      subject: "Pacing of Module 3", 
      description: "The teacher moved too quickly through advanced recursion concepts without enough practical examples.", 
      status: "Reviewed", 
      timestamp: "Oct 18, 2024 — 10:20 AM" 
    },
    { 
      id: "GRV-1025", 
      category: "Technical Support", 
      subject: "AWS Sandbox Access", 
      description: "Still waiting for login credentials for the cloud lab assigned in Batch A.", 
      status: "Pending", 
      timestamp: "Oct 19, 2024 — 02:45 PM" 
    }
  ]);

  const [form, setForm] = useState({ category: "", subject: "", description: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newGrv: Grievance = {
      id: `GRV-${Math.floor(1000 + Math.random() * 9000)}`,
      ...form,
      status: grievances.length >= 2 ? "Escalated" : "Pending",
      timestamp: new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    };
    
    setGrievances([newGrv, ...grievances]);
    setSubmitted(true);
    setForm({ category: "", subject: "", description: "" });
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-500">
      <header>
        <div className="flex items-center gap-3 mb-2">
           <div className="p-2 bg-error/10 text-error rounded-lg">
              <ShieldAlert className="w-5 h-5" />
           </div>
           <h1 className="text-3xl font-manrope font-bold tracking-tight">Complaint Box & Redressal</h1>
        </div>
        <p className="text-on_surface_variant max-w-2xl text-sm">
          A secure channel for absolute integrity. Your submissions are encrypted and strictly hidden from teaching staff.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Submission Form */}
        <div className="lg:col-span-2 space-y-6">
           <KnowledgeCard className="border-error/20 overflow-hidden relative">
              {/* Notice Bar */}
              <div className="bg-error/5 border-b border-error/10 p-4 flex items-center gap-3">
                 <EyeOff className="w-4 h-4 text-error" />
                 <p className="text-xs font-bold text-error uppercase tracking-widest">Teacher Exclusion Protocol Active</p>
              </div>

              <CardBody className="p-8">
                 <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                          <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Grievance Category</label>
                          <select 
                            required
                            value={form.category}
                            onChange={e => setForm({...form, category: e.target.value})}
                            className="w-full bg-surface_container_highest border border-outline_variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-error/50 transition-all cursor-pointer"
                          >
                             <option value="" disabled>Select Category...</option>
                             {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                       </div>
                       <div>
                          <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Subject Header</label>
                          <input 
                            required
                            type="text"
                            value={form.subject}
                            onChange={e => setForm({...form, subject: e.target.value})}
                            placeholder="Brief summary..."
                            className="w-full bg-surface_container_highest border border-outline_variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-error/50 transition-all font-medium"
                          />
                       </div>
                    </div>

                    <div>
                       <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Detailed Narrative</label>
                       <textarea 
                         required
                         rows={6}
                         value={form.description}
                         onChange={e => setForm({...form, description: e.target.value})}
                         placeholder="Describe the incident or concern with all relevant details..."
                         className="w-full bg-surface_container_highest border border-outline_variant/30 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-error/50 transition-all resize-none"
                       />
                    </div>

                    <div className="flex justify-between items-center pt-4">
                       <div className="flex items-center gap-2 text-outline">
                          <Lock className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">End-to-End Encrypted</span>
                       </div>
                       <button type="submit" className="px-8 py-3 bg-error text-on_error rounded-xl font-bold font-manrope shadow-glow-error hover:bg-error_bright transition-all flex items-center gap-2">
                          <Send className="w-4 h-4" /> File Protocol
                       </button>
                    </div>
                 </form>

                 {submitted && (
                   <div className="absolute inset-0 bg-surface/90 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-300">
                      <div className="text-center p-8 bg-surface_container_lowest border border-error/20 rounded-3xl shadow-ambient max-w-sm">
                         <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8" />
                         </div>
                         <h3 className="text-xl font-bold font-manrope text-on_surface mb-2">Protocol Filed</h3>
                         <p className="text-sm text-on_surface_variant mb-6 leading-relaxed">
                            Your grievance has been securely logged. It is now under review by the Institute Administration.
                         </p>
                         <button onClick={() => setSubmitted(false)} className="w-full py-2.5 bg-surface_container_high text-on_surface font-bold rounded-xl text-sm">
                            Submit Another
                         </button>
                      </div>
                   </div>
                 )}
              </CardBody>
           </KnowledgeCard>

           {/* Policy Card */}
           <div className="flex gap-4 p-5 bg-surface_container_low border border-outline_variant/20 rounded-2xl items-center">
              <div className="p-3 bg-primary/10 text-primary rounded-xl">
                 <Lock className="w-5 h-5" />
              </div>
              <div>
                 <h4 className="font-bold text-sm">Standard Operating Procedure</h4>
                 <p className="text-xs text-on_surface_variant leading-relaxed">
                    Complaints are prioritized by administration. If a student files more than 2 distinct grievances, the 3rd submission is automatically escalated to the **Accountability Vault** for Top Authority review.
                 </p>
              </div>
           </div>
        </div>

        {/* Right: History & Meter */}
        <div className="space-y-6">
           {/* Grievance Meter */}
           <KnowledgeCard className="bg-gradient-to-br from-surface to-surface_container_high shadow-ambient">
              <CardHeader>
                 <CardTitle className="text-sm flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-error" /> Integrity Meter
                 </CardTitle>
              </CardHeader>
              <CardBody className="pt-0">
                 <div className="flex items-center gap-4 mb-4">
                    <div className="text-3xl font-black font-manrope text-on_surface">{grievances.length}</div>
                    <div className="flex-1">
                       <div className="flex justify-between text-[10px] font-bold uppercase text-outline mb-1">
                          <span>Usage Frequency</span>
                          <span>{Math.round((grievances.length / 3) * 100)}%</span>
                       </div>
                       <div className="w-full h-2 bg-surface_container_highest rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-700 ${grievances.length >= 3 ? 'bg-error' : 'bg-primary'}`} 
                            style={{ width: `${Math.min(100, (grievances.length / 3) * 100)}%` }} 
                          />
                       </div>
                    </div>
                 </div>
                 {grievances.length >= 2 ? (
                   <div className="p-3 bg-error/10 border border-error/20 rounded-xl flex gap-2 items-start">
                      <AlertCircle className="w-4 h-4 text-error mt-0.5" />
                      <p className="text-[10px] font-medium text-error leading-relaxed">
                         **CRITICAL**: Your next submission will trigger direct notification to the Top Authority and bypass institute review.
                      </p>
                   </div>
                 ) : (
                   <p className="text-[10px] text-on_surface_variant leading-relaxed italic">
                      "System transparency is a core pillar of Azure Academy."
                   </p>
                 )}
              </CardBody>
           </KnowledgeCard>

           {/* Logs */}
           <KnowledgeCard className="flex-1">
              <CardHeader className="border-b border-outline_variant/10 pb-4 mb-2">
                 <CardTitle className="text-sm flex items-center gap-2">
                    <History className="w-4 h-4 text-outline" /> Filing Logs
                 </CardTitle>
              </CardHeader>
              <CardBody className="p-0">
                 {grievances.length === 0 ? (
                   <div className="p-12 text-center">
                      <Clock className="w-8 h-8 text-outline/30 mx-auto mb-3" />
                      <p className="text-xs text-outline font-bold uppercase tracking-widest">No filings found</p>
                   </div>
                 ) : (
                   <div className="divide-y divide-outline_variant/10">
                      {grievances.map(g => (
                        <div key={g.id} className="p-4 hover:bg-surface_container_low transition-colors group">
                           <div className="flex justify-between items-start mb-1">
                              <p className="text-[10px] font-extrabold text-primary uppercase tracking-widest">{g.category}</p>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                g.status === 'Escalated' ? 'bg-error text-on_error' : 
                                g.status === 'Reviewed'  ? 'bg-secondary/10 text-secondary' : 
                                                           'bg-outline_variant/30 text-outline'
                              }`}>
                                 {g.status}
                              </span>
                           </div>
                           <p className="text-xs font-bold text-on_surface group-hover:text-primary transition-colors mb-1 truncate">{g.subject}</p>
                           <p className="text-[10px] text-outline">{g.timestamp}</p>
                        </div>
                      ))}
                   </div>
                 )}
              </CardBody>
           </KnowledgeCard>
        </div>

      </div>
    </div>
  );
}
