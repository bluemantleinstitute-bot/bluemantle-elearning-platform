"use client";

import { useState } from "react";
import { KnowledgeCard, CardHeader, CardTitle, CardBody } from "@/components/KnowledgeCard";
import { PremiumCheckbox } from "@/components/PremiumCheckbox";
import { Smartphone, Shield, X, HelpCircle } from "lucide-react";

export function LinkedDevicesManager({ initialDevice }: { initialDevice: any }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [status, setStatus] = useState<"Authorised" | "Pending">("Authorised");
  
  // Form State
  const [requestType, setRequestType] = useState("Temporary");
  const [reason, setReason] = useState("");
  const [agreement, setAgreement] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreement) return;
    setStatus("Pending");
    setIsModalOpen(false);
    // In a real app, this dispatches to the server DB queue.
  };

  return (
    <>
      <KnowledgeCard className="bg-surface_container_low border-none">
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Linked Terminal</CardTitle>
          <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-sm ${status === 'Authorised' ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'}`}>
            {status}
          </span>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex gap-4 items-center bg-surface_container_lowest p-4 rounded-xl border border-primary/20 shadow-sm relative overflow-hidden">
            <div className={`absolute left-0 top-0 h-full w-1 ${status === 'Authorised' ? 'bg-primary' : 'bg-warning'}`}></div>
            <Smartphone className={`w-8 h-8 ${status === 'Authorised' ? 'text-primary' : 'text-warning'}`} />
            <div className="flex-1">
              <h5 className="font-bold text-sm text-on_surface">{initialDevice?.name || "Unknown Device"}</h5>
              <p className="text-[10px] text-outline tracking-wider font-mono uppercase mt-0.5">{initialDevice?.hardwareId || "ID NOT DETECTED"}</p>
            </div>
            <div className="text-right">
              <Shield className="w-4 h-4 text-primary ml-auto mb-1" />
              <p className="text-xs font-semibold text-on_surface_variant">{initialDevice?.lastActive || "Recently"}</p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            disabled={status === 'Pending'}
            className="w-full py-3 rounded-xl border border-outline_variant/30 text-xs font-bold text-on_surface hover:bg-surface_container_highest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'Pending' ? "Request Pending Admin Approval" : "Request Device Change..."}
          </button>
        </CardBody>
      </KnowledgeCard>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface_container_lowest w-full max-w-lg rounded-2xl shadow-ambient border border-outline_variant/20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-outline_variant/10">
              <h2 className="text-xl font-bold text-on_surface font-manrope">Device Change Request</h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-on_surface_variant hover:text-on_surface hover:bg-surface_container_high p-2 rounded-full transition-colors"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex gap-3 items-start">
                <HelpCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-xs text-on_surface_variant leading-relaxed">
                  For security and anti-fraud compliance, your account is cryptographically locked to a single device Signature / MAC ID. Logging in from multiple devices is strictly prohibited.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-3">Request Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`cursor-pointer border rounded-xl p-3 text-center transition-all ${requestType === 'Temporary' ? 'border-primary bg-primary/10 text-primary' : 'border-outline_variant/30 text-on_surface_variant hover:bg-surface_container_high'}`}>
                    <input type="radio" value="Temporary" checked={requestType === 'Temporary'} onChange={(e) => setRequestType(e.target.value)} className="sr-only" />
                    <span className="font-bold text-sm block">Temporary Access</span>
                    <span className="text-[10px]">24 Hour Window</span>
                  </label>
                  <label className={`cursor-pointer border rounded-xl p-3 text-center transition-all ${requestType === 'Permanent' ? 'border-primary bg-primary/10 text-primary' : 'border-outline_variant/30 text-on_surface_variant hover:bg-surface_container_high'}`}>
                    <input type="radio" value="Permanent" checked={requestType === 'Permanent'} onChange={(e) => setRequestType(e.target.value)} className="sr-only" />
                    <span className="font-bold text-sm block">Permanent Switch</span>
                    <span className="text-[10px]">Locks New Device ID</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Reason for Switch</label>
                <textarea 
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-surface_container_highest border border-outline_variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-on_surface transition-colors min-h-[100px]" 
                  placeholder="Explain why you are requesting access from a new piece of hardware..." 
                />
              </div>

              <label className="flex items-start gap-4 cursor-pointer group rounded-xl p-2 hover:bg-surface_container_low transition-colors w-full">
                <div className="mt-0.5 flex-shrink-0">
                   <PremiumCheckbox required checked={agreement} onChange={(e) => setAgreement(e.target.checked)} />
                </div>
                <span className="text-xs text-on_surface_variant leading-tight group-hover:text-on_surface transition-colors">
                  I agree to the Legal Disclaimer. I understand that misrepresenting device ownership or attempting to share account access violates the Terms of Service and will result in a permanent ban.
                </span>
              </label>

              <div className="flex gap-3 justify-end pt-2">
                <button type="submit" disabled={!agreement} className="w-full bg-primary text-on_primary px-6 py-3 rounded-full font-bold shadow-ambient hover:scale-105 active:scale-95 transition-all text-sm disabled:opacity-50 disabled:hover:scale-100">
                  Submit Authorization Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
