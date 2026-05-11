"use client";

import { useState } from "react";
import { KnowledgeCard, CardBody } from "@/components/KnowledgeCard";
import { 
  ShieldAlert, Lock, History, Send, 
  MessageSquare, UserX, AlertTriangle, Scale
} from "lucide-react";

export default function SuspensionTerminal() {
  const [submitted, setSubmitted] = useState(false);
  const [appealText, setAppealText] = useState("");

  const handleSubmitAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/institutional", {
      method: "POST",
      body: JSON.stringify({ 
        action: "appeal", 
        payload: { 
          studentId: "STU-8821", // Hardcoded for this demo session
          studentName: "John Doe",
          reason: appealText 
        } 
      })
    });
    if (res.ok) setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8 animate-in fade-in duration-1000">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        
        {/* Left Side: Notice */}
        <div className="space-y-8">
           <div className="inline-flex items-center gap-3 bg-error/10 border border-error/20 px-4 py-2 rounded-full shadow-sm">
              <ShieldAlert className="w-5 h-5 text-error" />
              <span className="text-[10px] font-black text-error uppercase tracking-[0.3em]">Access Protocol: Terminated</span>
           </div>
           
           <h1 className="text-5xl font-manrope font-black tracking-tighter text-on_surface leading-[0.9]">
              Institutional <br /> <span className="text-error">Restriction</span>
           </h1>
           
           <p className="text-on_surface_variant leading-relaxed text-lg max-w-sm">
              Your account has been formally flagged for breach of instructional conduct. All terminal access has been globally suspended until further review.
           </p>

           <div className="space-y-4">
              <div className="flex gap-4 items-center p-4 bg-surface_container_low border border-outline_variant/10 rounded-2xl">
                 <Lock className="w-5 h-5 text-outline" />
                 <div>
                    <p className="text-xs font-bold text-on_surface">Encrypted Lock</p>
                    <p className="text-[10px] text-outline font-medium tracking-wide">Device ID: MAC-99A1-B3C4-BLUEMANTLE</p>
                 </div>
              </div>
              <div className="flex gap-4 items-center p-4 bg-surface_container_low border border-outline_variant/10 rounded-2xl">
                 <History className="w-5 h-5 text-outline" />
                 <div>
                    <p className="text-xs font-bold text-on_surface">Interaction Audit</p>
                    <p className="text-[10px] text-outline font-medium tracking-wide">Last Incident: Oct 24, 2024</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Right Side: Appeal Form */}
        <KnowledgeCard className="border-error/20 shadow-2xl relative overflow-hidden bg-surface_container_lowest">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-error to-transparent" />
           
           {!submitted ? (
             <form onSubmit={handleSubmitAppeal} className="p-8 space-y-8">
                <div className="space-y-4">
                   <div className="flex items-center gap-3">
                      <Scale className="w-5 h-5 text-primary" />
                      <h3 className="text-xl font-bold font-manrope">Reactivation Appeal</h3>
                   </div>
                   <p className="text-sm text-on_surface_variant">
                      Explain the обстоятельства of the incident. This message will be transmitted directly to the Board of Authority for review.
                   </p>
                </div>

                <div className="space-y-3">
                   <label className="text-[10px] font-black text-outline uppercase tracking-widest px-1">Formal Statement</label>
                   <textarea 
                     required
                     value={appealText}
                     onChange={(e) => setAppealText(e.target.value)}
                     placeholder="Type your formal request here..."
                     className="w-full h-40 bg-surface_container px-6 py-4 rounded-3xl border border-outline_variant/20 focus:ring-2 ring-primary/20 outline-none text-sm transition-all"
                   />
                </div>

                <button 
                  type="submit"
                  className="w-full py-5 bg-on_surface text-surface_container_lowest rounded-3xl font-black font-manrope uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-on_surface_variant transition-all hover:scale-[1.02] active:scale-95"
                >
                   Transmit Appeal <Send className="w-5 h-5" />
                </button>

                <p className="text-[10px] text-outline font-medium text-center">
                   A response will be dispatched to your registered WhatsApp console within 24-48 business hours.
                </p>
             </form>
           ) : (
             <div className="p-16 text-center space-y-8 animate-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto text-primary">
                   <MessageSquare className="w-10 h-10" />
                </div>
                <div>
                   <h3 className="text-2xl font-bold font-manrope mb-3">Transmission Successful</h3>
                   <p className="text-sm text-on_surface_variant max-w-xs mx-auto leading-relaxed">
                      Your appeal REX-4421 has been logged in the Authority Vault. Restricted mode remains active during review.
                   </p>
                </div>
                <div className="pt-4">
                   <div className="inline-flex items-center gap-3 px-6 py-3 bg-surface_container_high rounded-full text-xs font-bold text-outline">
                      <History className="w-4 h-4" /> Final Step: Human Review Required
                   </div>
                </div>
             </div>
           )}
        </KnowledgeCard>

      </div>
    </div>
  );
}
