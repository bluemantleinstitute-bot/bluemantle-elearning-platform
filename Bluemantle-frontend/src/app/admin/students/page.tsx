"use client";

import { useState, useMemo } from "react";
import { KnowledgeCard, CardHeader, CardTitle, CardBody } from "@/components/KnowledgeCard";
import { DataTable } from "@/components/DataTable";
import { SwitchButton3D } from "@/components/SwitchButton3D";
import { Users, UserPlus, Search, Filter, MoreVertical, BadgeCheck, X, Activity, AlertTriangle } from "lucide-react";
import { PremiumSearch } from "@/components/PremiumSearch";
import { db } from "@/lib/db";
import { useEffect } from "react";
import { Copy, Key } from "lucide-react";

export default function StudentManagement() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: "", email: "", batchId: "", password: "", status: "active" });

  const [createdCredentials, setCreatedCredentials] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const [studentToSwitch, setStudentToSwitch] = useState<any>(null);
  const [newBatchSelection, setNewBatchSelection] = useState("");

  const [suspendConfirmStep, setSuspendConfirmStep] = useState(0); // 0=closed, 1=first, 2=second
  const [studentToSuspend, setStudentToSuspend] = useState<any>(null);

  // Master Batch List
  // const [batches] = useState([...]); // Removed static batches

  // Calculate current enrollment per batch dynamically
  const batchStats = useMemo(() => {
    const stats: Record<string, number> = {};
    batches.forEach(b => stats[b._id] = b.students?.length || 0);
    return stats;
  }, [batches]);

  // Modals Data
  // const [isModalOpen, setIsModalOpen] = useState(false);
  // const [newStudent, setNewStudent] = useState({ name: "", email: "", cohort: "", status: "Active" });


  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [studentsData, batchesData] = await Promise.all([
          db.user.getUsers("student"),
          db.user.getBatches()
        ]);
        setStudents(studentsData);
        setBatches(batchesData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await db.user.createUser({
        ...newStudent,
        role: "student"
      });
      
      if (response.success) {
        setCreatedCredentials(response.user);
        // Refresh list
        const studentsData = await db.user.getUsers("student");
        setStudents(studentsData);
        setIsModalOpen(false);
        setNewStudent({ name: "", email: "", batchId: "", password: "", status: "active" });

      } else {
        alert(response.message || "Failed to create student");
      }
    } catch (error) {
      console.error("Failed to create student:", error);
      alert("Error creating student");
    } finally {
      setSaving(false);
    }
  };

  const generatePassword = () => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";
    const all = uppercase + lowercase + numbers + symbols;
    
    let pass = "";
    // Ensure at least one of each type
    pass += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    pass += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    pass += numbers.charAt(Math.floor(Math.random() * numbers.length));
    pass += symbols.charAt(Math.floor(Math.random() * symbols.length));
    
    // Fill the rest up to 12 chars
    for (let i = 0; i < 8; i++) {
      pass += all.charAt(Math.floor(Math.random() * all.length));
    }
    
    // Shuffle the password
    pass = pass.split('').sort(() => Math.random() - 0.5).join('');
    
    setNewStudent({ ...newStudent, password: pass });
  };




  const handleSwitchBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentToSwitch || !newBatchSelection) return;

    try {
      setSaving(true);
      // 1. Remove from old batch if it exists
      if (studentToSwitch.batchId) {
        await db.user.removeStudentFromBatch(studentToSwitch.batchId, studentToSwitch.id);
      }
      
      // 2. Add to new batch
      await db.user.addStudentsToBatch(newBatchSelection, [studentToSwitch.id]);
      
      // 3. Refresh list
      const studentsData = await db.user.getUsers("student");
      setStudents(studentsData);
      
      setIsSwitchModalOpen(false);
      setStudentToSwitch(null);
      setNewBatchSelection("");
      alert("Batch switched successfully");
    } catch (error) {
      console.error("Failed to switch batch:", error);
      alert("Error switching batch");
    } finally {
      setSaving(false);
    }
  };


  const openSwitchModal = (student: any) => {
    setStudentToSwitch(student);
    // Pre-select current batch so admin can see where student is now
    setNewBatchSelection(student.batchId?.toString() || "");
    setIsSwitchModalOpen(true);
  };


  const openSuspendModal = (student: any) => {
    setStudentToSuspend(student);
    setSuspendConfirmStep(1); // single step now
  };


  const handleSuspend = async () => {
    if (!studentToSuspend) return;
    try {
      setSaving(true);
      const isSuspended = studentToSuspend.status === "suspended";
      const newStatus = isSuspended ? "active" : "suspended";
      await db.user.updateUserStatus(studentToSuspend.id, newStatus);
      const studentsData = await db.user.getUsers("student");
      setStudents(studentsData);
      setSuspendConfirmStep(0);
      setStudentToSuspend(null);
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Error updating account status");
    } finally {
      setSaving(false);
    }
  };


  const columns = [
    {
      key: "name",
      header: "Student",
      render: (val: string, row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-surface_container_high flex items-center justify-center font-bold text-xs text-primary">
            {val.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-on_surface">{val}</p>
            <p className="text-[10px] text-outline uppercase tracking-wider">{row.userId}</p>
          </div>

        </div>
      )
    },
    { key: "email", header: "Email Address" },
    { key: "cohort", header: "Cohort / Department", render: (val: string) => (
      <span className={val ? "" : "text-outline italic text-xs"}>
        {val || "Unassigned"}
      </span>
    )},

    { key: "password", header: "Credentials", render: (val: string) => (
      <div className="flex items-center gap-2 group/pass cursor-pointer" onClick={() => {
        navigator.clipboard.writeText(val);
        alert("Password copied to clipboard");
      }}>
        <Key className="w-3.5 h-3.5 text-outline group-hover/pass:text-primary transition-colors" />
        <span className="font-mono text-[10px] text-outline group-hover/pass:text-on_surface transition-colors">••••••••</span>
        <Copy className="w-3 h-3 opacity-0 group-hover/pass:opacity-100 transition-opacity ml-auto" />
      </div>
    )},
    {
      key: "status",
      header: "Status",
      render: (val: string) => (
        <span className={cn(
          "text-[10px] font-bold uppercase px-2 py-1 rounded-sm",
          val === 'active' || val === 'Active' ? 'bg-primary/10 text-primary' :
            val === 'pending' || val === 'Pending' ? 'bg-secondary/10 text-secondary' :
              'bg-error/10 text-error'
        )}>
          {val}
        </span>
      )
    },
    {
      key: "actions",
      header: "",
      render: (_: any, row: any) => (
        <div className="relative group">
          <button className="p-2 hover:bg-surface_container_highest rounded-full transition-colors">
            <MoreVertical className="w-4 h-4 text-outline" />
          </button>

          <div className="absolute right-0 top-10 mt-2 w-48 bg-surface_container_lowest border border-outline_variant/30 rounded-xl shadow-ambient opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
            <button
              onClick={() => {
                navigator.clipboard.writeText(`User ID: ${row.userId}\nPassword: ${row.password}`);
                alert("Credentials copied to clipboard");
              }}
              className="w-full text-left px-4 py-3 text-sm text-on_surface hover:bg-surface_container_high transition-colors font-semibold"
            >
              Copy Credentials
            </button>
            <button
              onClick={() => openSwitchModal(row)}
              className="w-full text-left px-4 py-3 text-sm text-on_surface hover:bg-surface_container_high transition-colors font-semibold border-t border-outline_variant/20"
            >
              Switch Batch
            </button>
            <button
              onClick={() => openSuspendModal(row)}
              className="w-full text-left px-4 py-3 text-sm text-error hover:bg-error/10 transition-colors font-semibold border-t border-outline_variant/20"
            >
              {row.status === 'suspended' ? 'Reactivate Account' : 'Suspend Account'}
            </button>

          </div>
        </div>
      )
    }
  ];


  const getCapacityColor = (current: number, max: number) => {
    const ratio = current / max;
    if (ratio >= 1) return 'text-error';
    if (ratio >= 0.8) return 'text-warning';
    return 'text-primary';
  };

  const getCapacityBg = (current: number, max: number) => {
    const ratio = current / max;
    if (ratio >= 1) return 'bg-error text-error';
    if (ratio >= 0.8) return 'bg-warning text-warning';
    return 'bg-primary text-primary';
  };

  return (
    <div className="space-y-8 pb-16 relative">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-manrope font-bold tracking-tight mb-2">Student Body</h1>
          <p className="text-on_surface_variant">Manage enrollments, status, and academic standing for Azure Academy.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-premium"
        >
          <UserPlus className="w-4 h-4" /> Add Student
        </button>
      </header>

      {/* Stats Quick View */}
      <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Students", value: students.length.toLocaleString(), icon: Users },
          { label: "Active Learners", value: students.filter(s => s.status === 'Active').length.toLocaleString(), icon: BadgeCheck },
          { label: "Pending Approvals", value: students.filter(s => s.status === 'Pending').length.toLocaleString(), icon: Filter },
          { label: "Batch Transfers", value: "3", icon: Activity },
        ].map((stat) => (
          <KnowledgeCard key={stat.label} className="p-6">
            <div className="flex gap-4 items-center">
              <div className="p-3 rounded-xl bg-surface_container_high text-primary">
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-outline uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-2xl font-bold font-manrope">{stat.value}</h3>
              </div>
            </div>
          </KnowledgeCard>
        ))}
      </section>

      {/* Filters & Table */}
      <KnowledgeCard>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-center border-b border-outline_variant/10 pb-6 mb-0">
          <CardTitle>Enrollment Directory</CardTitle>
          <div className="mt-4 sm:mt-0">
            <PremiumSearch placeholder="Search student or ID..." />
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <DataTable columns={columns} data={students} />
          <div className="p-6 flex justify-between items-center border-t border-outline_variant/10">
             <p className="text-xs text-on_surface_variant">Displaying 1-{students.length} of {students.length}</p>
             <div className="flex gap-3 items-center">
                <SwitchButton3D>Prev</SwitchButton3D>
                <span className="font-bold text-on_surface px-2">1</span>
                <SwitchButton3D>Next</SwitchButton3D>
             </div>
          </div>
        </CardBody>
      </KnowledgeCard>


      {/* MODAL 1: Add Student */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface_container_lowest w-full max-w-lg rounded-2xl shadow-ambient border border-outline_variant/20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-outline_variant/10">
              <h2 className="text-xl font-bold text-on_surface font-manrope">Add New Student</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-on_surface_variant hover:text-on_surface hover:bg-surface_container_high p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Full Name</label>
                <input required type="text" value={newStudent.name} onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })} className="w-full bg-surface_container_highest border border-outline_variant/30 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-on_surface transition-colors" placeholder="e.g. John Doe" />
              </div>

              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Email Address</label>
                <input required type="email" value={newStudent.email} onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })} className="w-full bg-surface_container_highest border border-outline_variant/30 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-on_surface transition-colors" placeholder="john@academy.edu" />
              </div>

              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Login Password</label>
                <div className="flex gap-2">
                  <input 
                    required 
                    type="text" 
                    value={newStudent.password} 
                    onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })} 
                    className="flex-1 bg-surface_container_highest border border-outline_variant/30 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-on_surface transition-colors font-mono" 
                    placeholder="Set or Generate Password" 
                  />
                  <button 
                    type="button"
                    onClick={generatePassword}
                    className="px-4 bg-primary/10 text-primary rounded-lg font-bold text-xs hover:bg-primary/20 transition-colors"
                  >
                    Generate
                  </button>
                </div>
              </div>


              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Assign Cohort / Batch</label>
                  <select
                    required
                    value={newStudent.batchId}
                    onChange={(e) => setNewStudent({ ...newStudent, batchId: e.target.value })}
                    className="w-full bg-surface_container_highest border border-outline_variant/30 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-on_surface transition-colors appearance-none"
                  >
                    <option value="" disabled>Select Batch...</option>
                    {batches.map(b => (
                      <option key={b._id} value={b._id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Status</label>
                  <select value={newStudent.status} onChange={(e) => setNewStudent({ ...newStudent, status: e.target.value })} className="w-full bg-surface_container_highest border border-outline_variant/30 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-on_surface transition-colors appearance-none">
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>

              </div>

              {/* Dynamic Capacity Visualizer below select */}
              {newStudent.batchId && (
                <div className={`mt-2 p-3 rounded-lg border ${batchStats[newStudent.batchId] >= 100 ? 'border-error/30 bg-error/5' : 'border-outline_variant/20 bg-surface_container_highest'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-on_surface">Batch Capacity Target</span>
                    <span className={`text-xs font-bold ${getCapacityColor(batchStats[newStudent.batchId], 100)}`}>
                      {batchStats[newStudent.batchId]} / 100
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-outline_variant/20 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-opacity-80 rounded-full transition-all duration-500 ${getCapacityBg(batchStats[newStudent.batchId], 100)}`}
                      style={{ width: `${Math.min(100, Math.max(0, (batchStats[newStudent.batchId] / 100) * 100))}%` }}
                    />
                  </div>
                  {batchStats[newStudent.batchId] >= 100 && (
                    <div className="flex gap-2 items-center mt-2 text-error">
                      <AlertTriangle className="w-3 h-3" />
                      <span className="text-[10px] font-bold">This batch is completely full. System override required.</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 justify-end mt-8 border-t border-outline_variant/10 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-full font-bold text-sm text-on_surface_variant hover:bg-surface_container_high transition-colors">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="btn-premium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Enrolling..." : "Enroll Student"}
                </button>

              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1.5: Created Credentials */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface_container_lowest w-full max-w-sm rounded-2xl shadow-ambient border-2 border-primary/20 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                 <BadgeCheck className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-on_surface mb-2">Student Enrolled!</h2>
              <p className="text-sm text-on_surface_variant mb-8">Secure the following credentials for the user. These can also be retrieved from the directory.</p>
              
              <div className="space-y-4 text-left">
                <div className="p-4 bg-surface_container_highest rounded-xl border border-outline_variant/20">
                   <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">User ID / Sign In ID</p>
                   <div className="flex justify-between items-center">
                      <code className="font-mono font-bold text-primary">{createdCredentials.userId}</code>
                      <button onClick={() => { navigator.clipboard.writeText(createdCredentials.userId); alert("Copied ID"); }} className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors">
                        <Copy className="w-4 h-4" />
                      </button>
                   </div>
                </div>
                <div className="p-4 bg-surface_container_highest rounded-xl border border-outline_variant/20">
                   <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Generated Password</p>
                   <div className="flex justify-between items-center">
                      <code className="font-mono font-bold text-primary">{createdCredentials.password}</code>
                      <button onClick={() => { navigator.clipboard.writeText(createdCredentials.password); alert("Copied Password"); }} className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors">
                        <Copy className="w-4 h-4" />
                      </button>
                   </div>
                </div>
              </div>

              <button 
                onClick={() => setCreatedCredentials(null)}
                className="w-full mt-8 py-3 bg-primary text-on_primary rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
              >
                Done & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {isSwitchModalOpen && studentToSwitch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface_container_lowest w-full max-w-sm rounded-2xl shadow-ambient border border-outline_variant/20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-outline_variant/10">
              <h2 className="text-xl font-bold text-on_surface font-manrope">Switch Batch</h2>
              <button onClick={() => setIsSwitchModalOpen(false)} className="text-on_surface_variant hover:text-on_surface hover:bg-surface_container_high p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSwitchBatch} className="p-6 space-y-4">
              <div>
                <p className="text-xs text-on_surface_variant">Re-assigning</p>
                <p className="font-bold text-on_surface text-lg">{studentToSwitch.name}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Select Target Batch</label>
                <select
                  required
                  value={newBatchSelection}
                  onChange={(e) => setNewBatchSelection(e.target.value)}
                  className="w-full bg-surface_container_highest border border-outline_variant/30 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-on_surface transition-colors appearance-none"
                >
                  <option value="" disabled>Select a batch...</option>
                  {batches.map(b => (
                    <option key={b._id} value={b._id}>
                      {b.name} {b._id === studentToSwitch.batchId?.toString() ? '(Current)' : ''} — {batchStats[b._id] || 0} enrolled
                    </option>
                  ))}

                </select>
              </div>

              {/* Dynamic target visualizer */}
              {newBatchSelection && newBatchSelection !== studentToSwitch.cohort && (
                <div className={`mt-2 p-3 rounded-lg border ${batchStats[newBatchSelection] >= 100 ? 'border-error/30 bg-error/5' : 'border-outline_variant/20 bg-surface_container_highest'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-on_surface">Target Capacity</span>
                    <span className={`text-xs font-bold ${getCapacityColor(batchStats[newBatchSelection] || 0, 100)}`}>
                      {batchStats[newBatchSelection] || 0} / 100
                    </span>
                  </div>

                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 mt-4 border-t border-outline_variant/10">
                <button type="submit" disabled={saving || (batchStats[newBatchSelection] || 0) >= 100} className="w-full bg-primary text-on_primary px-4 py-2.5 rounded-full font-bold shadow-sm disabled:opacity-50 text-sm">
                  {saving ? "Allocating..." : "Confirm Allocation"}
                </button>

              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Suspend Confirmation - Single Step */}

      {suspendConfirmStep === 1 && studentToSuspend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface_container_lowest w-full max-w-sm rounded-2xl shadow-ambient border border-error/20 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="w-14 h-14 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-5">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-on_surface mb-2 font-manrope">
                {studentToSuspend.status === 'suspended' ? 'Reactivate Account?' : 'Suspend Account?'}
              </h2>
              <p className="text-sm text-on_surface_variant mb-2">
                You are about to <strong>{studentToSuspend.status === 'suspended' ? 'reactivate' : 'suspend'}</strong> the account of:
              </p>
              <p className="font-bold text-on_surface text-lg mb-6">{studentToSuspend.name}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setSuspendConfirmStep(0); setStudentToSuspend(null); }}
                  className="flex-1 px-4 py-2.5 rounded-full font-bold text-sm text-on_surface_variant hover:bg-surface_container_high transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSuspend}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-full font-bold text-sm bg-error text-white hover:bg-error/90 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Processing...' : (studentToSuspend.status === 'suspended' ? 'Reactivate' : 'Suspend')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper for conditional classes
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
