"use client";

import { useState, useEffect } from "react";
import { KnowledgeCard, CardHeader, CardTitle, CardBody } from "@/components/KnowledgeCard";
import { 
  Lock, ShieldAlert, Bell, AlertTriangle, 
  UserSquare2, History, Scale, FileWarning,
  Eye, Zap, Download, LockKeyhole, UserCheck, UserX,
  MessageSquare, ShieldCheck
} from "lucide-react";

type Escalation = {
  id: string;
  student: string;
  studentId: string;
  batch: string;
  category: string;
  description: string;
  frequency: number;
  timestamp: string;
  type: "Grievance" | "Appeal";
  status: "Immediate Attention" | "Under Review" | "Resolved" | "Suspended";
};

export default function AuthorityVaultPage() {
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [activeIncident, setActiveIncident] = useState<Escalation | null>(null);

  const fetchRegistry = async () => {
    const res = await fetch("/api/institutional");
    const data = await res.json();
    
    // Map JSON data to the UI format
    const mappedappeals: Escalation[] = data.appeals.map((a: any) => ({
      id: a.id,
      student: a.studentName,
      studentId: a.studentId,
      batch: "Batch A",
      category: "Reactivation Appeal",
      description: a.reason,
      frequency: 0,
      timestamp: new Date(a.timestamp).toLocaleString(),
      type: "Appeal",
      status: a.status === 'pending' ? "Suspended" : "Resolved"
    }));

    // Add some hardcoded grievances if none exist, for demo purposes
    const grievances: Escalation[] = [
      {
        id: "ESX-9001",
        student: "Alice Waverly",
        studentId: "STU-8901",
        batch: "Advanced AI",
        category: "Instructional Quality",
        description: "Third formal complaint regarding lab downtime and teacher responsiveness. Student has triggered the 3-strike escalation protocol.",
        frequency: 3,
        timestamp: "2024-10-24T11:30:00Z",
        type: "Grievance",
        status: "Immediate Attention"
      }
    ];

    setEscalations([...mappedappeals, ...grievances]);
  };

  useEffect(() => {
    fetchRegistry();
  }, []);

  const handleResolveAppeal = async (appealId: string, decision: "approved" | "denied") => {
    const res = await fetch("/api/institutional", {
      method: "POST",
      body: JSON.stringify({ 
        action: "resolveAppeal", 
        payload: { appealId, decision } 
      })
    });
    
    if (res.ok) {
      alert(`Institutional Protocol Complete: Appeal ${appealId} ${decision}.`);
      fetchRegistry();
      setActiveIncident(null);
    }
  };

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-error text-on_error rounded-2xl shadow-glow-error">
              <LockKeyhole className="w-6 h-6" />
           </div>
           <div>
              <h1 className="text-3xl font-manrope font-extrabold tracking-tight">Authority Vault</h1>
              <p className="text-on_surface_variant text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                 <ShieldAlert className="w-4 h-4 text-error" /> Security Clearance: Top Authority / Owner
              </p>
           </div>
        </div>
        
        <div className="flex gap-6">
           <div className="flex gap-4 p-4 bg-error/10 border border-error/20 rounded-2xl">
              <div className="p-2 bg-error text-on_error rounded-full ring-4 ring-error/20">
                 <Bell className="w-4 h-4" />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-error uppercase tracking-widest">Critical Grievances</p>
                 <p className="text-lg font-black text-on_surface">{escalations.filter(e=>e.status === 'Immediate Attention').length} Alerts</p>
              </div>
           </div>

           <div className="flex gap-4 p-4 bg-primary/10 border border-primary/20 rounded-2xl">
              <div className="p-2 bg-primary text-on_primary rounded-full ring-4 ring-primary/20">
                 <UserCheck className="w-4 h-4" />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Reactivation Appeals</p>
                 <p className="text-lg font-black text-on_surface">{escalations.filter(e=>e.status === 'Suspended').length} Pending</p>
              </div>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8 h-[calc(100vh-320px)]">
        {/* Left: Incident Queue */}
        <div className="col-span-3 flex flex-col gap-4 overflow-y-auto pr-2 hide-scrollbar">
           <h3 className="text-xs font-bold text-outline uppercase tracking-widest px-1">Institutional Queue</h3>
           {escalations.map(e => (
             <div 
               key={e.id}
               onClick={() => setActiveIncident(e)}
               className={`p-5 border cursor-pointer rounded-2xl transition-all relative overflow-hidden group ${
                 activeIncident?.id === e.id 
                   ? 'border-error bg-surface_container_highest ring-1 ring-error/30' 
                   : 'border-outline_variant/20 bg-surface_container_low hover:border-error/50'
               }`}
             >
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${e.status === 'Suspended' ? 'text-primary' : 'text-error'}`}>{e.id}</p>
                <p className="font-bold text-on_surface group-hover:text-primary transition-colors">{e.student}</p>
                <div className="flex items-center gap-2 mt-2">
                   <div className={`px-2 py-0.5 rounded font-bold text-[9px] ${e.status === 'Suspended' ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'}`}>
                      {e.status === 'Suspended' ? 'APPEAL' : `STRIKE ${e.frequency}`}
                   </div>
                   <span className="text-[9px] font-black text-outline uppercase tracking-tighter truncate">{e.category}</span>
                </div>
             </div>
           ))}
        </div>

        {/* Right: Decision Command Center */}
        <div className="col-span-9">
           {activeIncident ? (
             <KnowledgeCard className="h-full flex flex-col relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-1 bg-${activeIncident.type === 'Appeal' ? 'primary' : 'error'}`} />
                <CardHeader className="border-b border-outline_variant/10 pb-6">
                   <div className="flex justify-between items-start">
                      <div>
                         <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1 ${activeIncident.type === 'Appeal' ? 'text-primary' : 'text-error'}`}>
                            {activeIncident.type === 'Appeal' ? <History className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                            {activeIncident.type === 'Appeal' ? 'Account Reactivation Protocol' : 'Instructional Conduct Breach'}
                         </p>
                         <CardTitle className="text-3xl font-black font-manrope tracking-tight">{activeIncident.student}</CardTitle>
                         <div className="flex gap-4 mt-2">
                            <span className="text-xs font-bold text-outline uppercase tracking-widest">ID: {activeIncident.studentId}</span>
                            <span className="text-xs font-bold text-outline uppercase tracking-widest">Batch: {activeIncident.batch}</span>
                         </div>
                      </div>
                      <div className="text-right">
                         <div className={`px-4 py-2 rounded-xl font-bold text-xs shadow-lg inline-block uppercase tracking-widest ${
                           activeIncident.type === 'Appeal' ? 'bg-primary text-on_primary' : 'bg-error text-on_error'
                         }`}>
                            {activeIncident.status.toUpperCase()}
                         </div>
                      </div>
                   </div>
                </CardHeader>

                <CardBody className="flex-1 overflow-y-auto p-8 space-y-12">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-8">
                         <div className="p-8 bg-surface_container_highest border rounded-[2rem] relative shadow-ambient border-outline_variant/10">
                            <h4 className={`text-xs font-bold uppercase tracking-[0.2em] mb-6 flex items-center gap-2 ${activeIncident.type === 'Appeal' ? 'text-primary' : 'text-error'}`}>
                               {activeIncident.type === 'Appeal' ? <MessageSquare className="w-4 h-4" /> : <FileWarning className="w-4 h-4" />}
                               Formal Documentation
                            </h4>
                            <p className="text-lg font-medium text-on_surface leading-relaxed italic">
                               "{activeIncident.description}"
                            </p>
                         </div>
                      </div>

                      <div className="space-y-8">
                         <KnowledgeCard className="p-10 bg-surface_container_low border-outline_variant/20 shadow-ambient">
                            <h4 className="text-xs font-bold text-outline uppercase tracking-[0.2em] mb-8">Performance Analytics</h4>
                            <div className="grid grid-cols-2 gap-10">
                               <div className="text-center">
                                  <p className="text-5xl font-black font-manrope tracking-tighter">96%</p>
                                  <p className="text-[10px] text-outline font-bold uppercase tracking-widest mt-2">Attendance</p>
                               </div>
                               <div className="text-center border-l border-outline_variant/10 pl-10">
                                  <p className="text-5xl font-black font-manrope tracking-tighter text-primary">82%</p>
                                  <p className="text-[10px] text-outline font-bold uppercase tracking-widest mt-2">Progress</p>
                               </div>
                            </div>
                         </KnowledgeCard>

                         <div className="space-y-4 pt-4">
                            <h4 className="text-xs font-black text-on_surface uppercase tracking-[0.3em] px-1">Authority Execution</h4>
                            {activeIncident.type === 'Appeal' && activeIncident.status === 'Suspended' ? (
                              <>
                                <button 
                                  onClick={() => handleResolveAppeal(activeIncident.id, "approved")}
                                  className="w-full py-5 px-8 bg-primary text-on_primary rounded-2xl font-black font-manrope shadow-glow-primary flex items-center justify-between group transition-all"
                                >
                                   <span className="uppercase tracking-widest">Allow Reactivation</span>
                                   <UserCheck className="w-6 h-6 group-hover:scale-125 transition-transform" />
                                </button>
                                <button 
                                   onClick={() => handleResolveAppeal(activeIncident.id, "denied")}
                                   className="w-full py-5 px-8 bg-surface_container_highest text-error rounded-2xl font-black font-manrope border border-error/50 flex items-center justify-between group transition-all"
                                >
                                   <span className="uppercase tracking-widest">Deny & Dismiss</span>
                                   <UserX className="w-6 h-6 group-hover:scale-125 transition-transform" />
                                </button>
                              </>
                            ) : (
                               <button className="w-full py-5 px-8 bg-error/10 text-error rounded-2xl font-black font-manrope border border-error/30 flex items-center justify-between group transition-all">
                                  <span className="uppercase tracking-widest">Case Resolved</span>
                                  <ShieldCheck className="w-6 h-6" />
                               </button>
                            )}
                         </div>
                      </div>
                   </div>
                </CardBody>
             </KnowledgeCard>
           ) : (
             <div className="h-full bg-surface_container_low/40 border-4 border-dashed border-outline_variant/10 rounded-[4rem] flex flex-col items-center justify-center text-center p-20">
                <div className="w-32 h-32 bg-surface_container_high rounded-[3rem] flex items-center justify-center mb-10 relative">
                   <Lock className="w-12 h-12 text-outline/30" />
                   <div className="absolute inset-0 ring-4 ring-outline_variant/10 ring-offset-8 rounded-[3rem] animate-ping opacity-20" />
                </div>
                <h3 className="text-4xl font-black font-manrope text-on_surface mb-4 tracking-tighter italic uppercase">Vault Standby</h3>
                <p className="text-base text-on_surface_variant max-w-lg leading-relaxed mb-12">
                   Awaiting administrative selection. Decisions are logged for institutional integrity.
                </p>
                <div className="flex gap-8">
                   <div className="flex items-center gap-3 px-6 py-3 bg-surface_container_highest border border-outline_variant/10 rounded-xl text-[10px] font-black text-outline uppercase tracking-widest">
                      <Zap className="w-4 h-4 text-error" /> Uplink Active
                   </div>
                   <div className="flex items-center gap-3 px-6 py-3 bg-surface_container_highest border border-outline_variant/10 rounded-xl text-[10px] font-black text-outline uppercase tracking-widest">
                      <ShieldCheck className="w-4 h-4 text-primary" /> Authority Verified
                   </div>
                </div>
             </div>
           )}
        </div>
      </div>

      <footer className="pt-8 border-t border-outline_variant/10 flex flex-col md:flex-row justify-between items-center gap-4">
         <p className="text-[10px] font-bold text-outline uppercase tracking-widest flex items-center gap-2">
            <Lock className="w-3 h-3" /> System Hash: {Math.random().toString(16).slice(2, 12).toUpperCase()}
         </p>
         <div className="flex gap-6">
            <button className="text-[10px] font-bold text-outline uppercase hover:text-error transition-colors flex items-center gap-2">
               <Download className="w-3 h-3" /> System Export
            </button>
            <button className="text-[10px] font-bold text-outline uppercase hover:text-error transition-colors flex items-center gap-2">
               <Eye className="w-3 h-3" /> Privacy Audit
            </button>
         </div>
      </footer>
    </div>
  );
}
