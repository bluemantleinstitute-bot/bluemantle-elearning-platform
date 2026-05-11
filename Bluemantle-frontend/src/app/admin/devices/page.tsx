"use client";

import { useState, useEffect } from "react";
import { KnowledgeCard, CardHeader, CardTitle, CardBody } from "@/components/KnowledgeCard";
import { Laptop2, ShieldCheck, Search, CheckCircle2, AlertCircle, RefreshCcw, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/api";

export default function DeviceControl() {
  const [searchQuery, setSearchQuery] = useState("");
  const [foundStudent, setFoundStudent] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [message, setMessage] = useState("");

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setMessage("");
    try {
      const res = await apiRequest(`/users?role=student`);
      if (res.success) {
        const student = res.users.find((u: any) => 
          u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          u.userId?.toLowerCase() === searchQuery.toLowerCase()
        );
        setFoundStudent(student || null);
        if (!student) setMessage("No student found with that name or ID.");
      }
    } catch (err) {
      console.error("Search failed:", err);
      setMessage("Failed to search students.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleForceUnlink = async () => {
    if (!foundStudent || !window.confirm(`Are you sure you want to force unlink the device for ${foundStudent.name}?`)) return;
    setIsUnlinking(true);
    try {
      const res = await apiRequest(`/users/${foundStudent.id}/unlink-device`, { method: "PATCH" });
      if (res.success) {
        setFoundStudent({ ...foundStudent, deviceId: null, deviceStatus: "None" });
        alert("Device unlinked successfully. The student can now link a new device upon their next login.");
      }
    } catch (err) {
      console.error("Unlink failed:", err);
      alert("Failed to unlink device.");
    } finally {
      setIsUnlinking(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-manrope font-bold tracking-tight mb-2">Device Control & Security</h1>
          <p className="text-on_surface_variant max-w-2xl">
            Manage student hardware linking, monitor terminal integrity, and enforce single-device access policies for the Azure Academy portal.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Control Panel */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Quick Lookup */}
          <KnowledgeCard>
            <CardHeader>
              <CardTitle>Student Device Lookup</CardTitle>
            </CardHeader>
            <CardBody className="pt-0">
               <div className="relative mb-8 flex gap-2">
                 <div className="relative flex-1">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
                   <input 
                     type="text" 
                     placeholder="Enter Student Name or AZ-ID..." 
                     className="w-full bg-surface_container_low border border-outline_variant/30 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                   />
                 </div>
                 <button 
                   onClick={handleSearch}
                   disabled={isSearching}
                   className="bg-primary text-on_primary px-6 rounded-2xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                 >
                   {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : "Search"}
                 </button>
               </div>

               {message && <p className="text-sm text-error mb-4 font-medium">{message}</p>}

               {foundStudent ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-surface_container_low border border-outline_variant/20 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex gap-4 items-center">
                       <div className="w-16 h-16 rounded-2xl bg-surface_container_highest flex items-center justify-center text-primary">
                          <Laptop2 className="w-10 h-10" />
                       </div>
                       <div>
                          <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Current Linked Device</p>
                          <h4 className="font-bold text-on_surface underline decoration-primary/30 underline-offset-4">
                            {foundStudent.deviceId ? "Hardware Hash Linked" : "No Device Linked"}
                          </h4>
                          <p className="text-[10px] text-outline font-mono mt-1 truncate max-w-[200px]">
                            {foundStudent.deviceId || "UNBOUND"}
                          </p>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Last Active</p>
                          <p className="text-sm font-bold text-on_surface">
                            {foundStudent.lastActive ? new Date(foundStudent.lastActive).toLocaleString() : "Never"}
                          </p>
                       </div>
                       <div>
                          <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Status</p>
                          <p className={`text-sm font-bold ${foundStudent.deviceId ? "text-primary" : "text-outline"}`}>
                            {foundStudent.deviceId ? "Device Locked" : "Available"}
                          </p>
                       </div>
                    </div>
                    <div className="md:col-span-2 flex justify-between items-center pt-4 border-t border-outline_variant/10">
                       <div className="flex items-center gap-2 text-primary font-bold text-sm">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Security: Single-Device Policy</span>
                       </div>
                       {foundStudent.deviceId && (
                         <button 
                           onClick={handleForceUnlink}
                           disabled={isUnlinking}
                           className="text-xs font-bold text-error hover:bg-error/10 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                         >
                           {isUnlinking ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCcw className="w-3 h-3" />}
                           Force Unlink
                         </button>
                       )}
                    </div>
                 </div>
               ) : (
                 <div className="p-12 text-center border-2 border-dashed border-outline_variant/20 rounded-2xl text-on_surface_variant">
                    <Search className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">Search for a student to view and manage their linked device.</p>
                 </div>
               )}
            </CardBody>
          </KnowledgeCard>

          {/* Queue */}
          <KnowledgeCard>
            <CardHeader className="flex justify-between items-center mb-0 border-b border-outline_variant/10 pb-6">
              <CardTitle>Device Change Requests</CardTitle>
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded uppercase tracking-widest">Coming Soon</span>
            </CardHeader>
            <CardBody className="p-12 text-center">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="w-16 h-16 bg-surface_container_highest rounded-full flex items-center justify-center mx-auto text-primary/40">
                    <RefreshCcw className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold font-manrope text-on_surface">Automated Request System</h3>
                  <p className="text-sm text-on_surface_variant leading-relaxed">
                    We are building a secure workflow for students to request device switches autonomously. 
                    Currently, the policy is strictly **one device per account**. 
                  </p>
                  <div className="p-4 bg-surface_container_low border border-outline_variant/20 rounded-xl text-left text-xs space-y-2">
                    <p className="font-bold text-primary">Current Security Workflow:</p>
                    <ul className="list-disc pl-4 space-y-1 text-on_surface_variant">
                      <li>Student accounts are strictly locked to the first device they use to log in.</li>
                      <li>Any attempt to log in from a different hardware signature is automatically blocked by the system.</li>
                      <li>To switch devices, a student must contact an administrator for a manual reset.</li>
                      <li>Admin can use **Force Unlink** above to clear the current hardware binding for any student.</li>
                      <li>Once unlinked, the very next device the student uses to log in will be automatically registered as their new locked device.</li>
                    </ul>
                  </div>
                </div>
            </CardBody>
          </KnowledgeCard>
        </div>

        {/* Info / Sidebar */}
        <div className="space-y-8">
           <KnowledgeCard className="bg-primary text-on_primary border-none overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-on_primary/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              <CardBody className="p-8 relative z-10">
                 <div className="flex gap-4 items-center mb-6">
                    <ShieldCheck className="w-8 h-8 text-on_primary_container" />
                    <div>
                       <h4 className="font-manrope font-bold text-lg leading-tight">Security Protocol</h4>
                       <p className="text-xs text-on_primary_container opacity-80">Anti-Fraud Protection: Active</p>
                    </div>
                 </div>
                 <p className="text-sm text-on_primary_container leading-relaxed mb-6">
                   All student accounts are inherently restricted to a single registered hardware hash. Secondary logins will automatically be blocked until OTP verification is completed.
                 </p>
                 <div className="p-4 rounded-xl bg-on_primary/10 border border-on_primary/20">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[10px] font-bold uppercase tracking-widest">Fraud Detection</span>
                       <CheckCircle2 className="w-4 h-4 text-secondary_fixed" />
                    </div>
                    <p className="text-xs font-bold">Hardware Locking Active</p>
                 </div>
              </CardBody>
           </KnowledgeCard>

           <div className="grid grid-cols-1 gap-4">
              <KnowledgeCard className="p-6 border-outline_variant/20 bg-surface_container_low">
                 <div className="flex gap-4 items-center">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary">
                       <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                       <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Device Policy</p>
                       <h4 className="text-xl font-bold font-manrope text-on_surface">1:1 Mapping</h4>
                       <p className="text-[10px] text-on_surface_variant mt-1 font-semibold">Strict hardware binding enforced on all student tiers.</p>
                    </div>
                 </div>
              </KnowledgeCard>
           </div>
        </div>
      </div>
    </div>
  );
}
