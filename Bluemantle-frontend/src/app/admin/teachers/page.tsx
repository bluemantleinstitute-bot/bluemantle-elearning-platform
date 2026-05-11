"use client";

import { useState, useMemo, useEffect } from "react";
import { KnowledgeCard, CardHeader, CardTitle, CardBody } from "@/components/KnowledgeCard";
import { DataTable } from "@/components/DataTable";
import { SwitchButton3D } from "@/components/SwitchButton3D";
import { GraduationCap, UserPlus, Search, Filter, BookOpen, Activity, X, Copy, Key, BadgeCheck } from "lucide-react";
import { db } from "@/lib/db";

export default function TeacherManagement() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<any>(null);

  const [newFaculty, setNewFaculty] = useState({ name: "", email: "", title: "", password: "" });

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoading(true);
        const data = await db.user.getUsers("teacher");
        setTeachers(data || []);
      } catch (error) {
        console.error("Failed to fetch teachers:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, []);

  const filteredTeachers = useMemo(() => {
    return teachers.filter(t =>
      t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [teachers, searchQuery]);

  const generatePassword = () => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";
    const all = uppercase + lowercase + numbers + symbols;
    let pass = "";
    pass += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    pass += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    pass += numbers.charAt(Math.floor(Math.random() * numbers.length));
    pass += symbols.charAt(Math.floor(Math.random() * symbols.length));
    for (let i = 0; i < 8; i++) pass += all.charAt(Math.floor(Math.random() * all.length));
    setNewFaculty({ ...newFaculty, password: pass.split("").sort(() => Math.random() - 0.5).join("") });
  };

  const handleRecruit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaculty.name || !newFaculty.email || !newFaculty.password) return;
    try {
      setSaving(true);
      const response = await db.user.createUser({
        name: newFaculty.name,
        email: newFaculty.email,
        title: newFaculty.title,
        password: newFaculty.password,
        role: "teacher",
      });
      if (response.success) {
        setCreatedCredentials(response.user);
        const data = await db.user.getUsers("teacher");
        setTeachers(data || []);
        setIsAddModalOpen(false);
        setNewFaculty({ name: "", email: "", title: "", password: "" });
      } else {
        alert(response.message || "Failed to recruit faculty");
      }
    } catch (error) {
      console.error("Failed to recruit faculty:", error);
      alert("Error recruiting faculty");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: "name",
      header: "Faculty Member",
      render: (val: string, row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-signature-gradient text-on_primary flex items-center justify-center font-bold text-sm shadow-sm">
            {val?.split(" ").map((n: string) => n[0]).join("").substring(0, 2)}
          </div>
          <div>
            <p className="font-bold text-on_surface">{val}</p>
            <p className="text-[10px] text-outline uppercase tracking-wider">{row.userId}</p>
          </div>
        </div>
      )
    },
    { key: "email", header: "Email Address" },
    {
      key: "title",
      header: "Title / Role",
      render: (val: string) => (
        <span className={val ? "" : "text-outline italic text-xs"}>{val || "—"}</span>
      )
    },
    {
      key: "password",
      header: "Credentials",
      render: (val: string, row: any) => (
        <div
          className="flex items-center gap-2 group/pass cursor-pointer"
          onClick={() => {
            navigator.clipboard.writeText(`User ID: ${row.userId}\nPassword: ${val}`);
            alert("Credentials copied to clipboard");
          }}
        >
          <Key className="w-3.5 h-3.5 text-outline group-hover/pass:text-primary transition-colors" />
          <span className="font-mono text-[10px] text-outline group-hover/pass:text-on_surface transition-colors">••••••••</span>
          <Copy className="w-3 h-3 opacity-0 group-hover/pass:opacity-100 transition-opacity ml-auto" />
        </div>
      )
    },
    {
      key: "status",
      header: "Status",
      render: (val: string) => (
        <span className={cn(
          "text-[10px] font-bold uppercase px-2 py-1 rounded-sm",
          val === "active" || val === "Active" ? "bg-primary/10 text-primary" :
            val === "suspended" ? "bg-error/10 text-error" : "bg-outline/10 text-outline"
        )}>
          {val || "active"}
        </span>
      )
    },
    {
      key: "actions",
      header: "",
      render: (_: any, row: any) => (
        <div className="relative group">
          <button className="p-2 hover:bg-surface_container_highest rounded-full transition-colors text-outline">
            ···
          </button>
          <div className="absolute right-0 top-8 w-44 bg-surface_container_lowest border border-outline_variant/30 rounded-xl shadow-ambient opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
            <button
              onClick={() => {
                navigator.clipboard.writeText(`User ID: ${row.userId}\nPassword: ${row.password}`);
                alert("Credentials copied!");
              }}
              className="w-full text-left px-4 py-3 text-sm text-on_surface hover:bg-surface_container_high transition-colors font-semibold"
            >
              Copy Credentials
            </button>
          </div>
        </div>
      )
    }
  ];

  if (loading) return <div className="p-20 text-center animate-pulse text-on_surface_variant">Loading Faculty...</div>;

  return (
    <div className="space-y-8 pb-16">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-manrope font-bold tracking-tight mb-2">Teacher Management</h1>
          <p className="text-on_surface_variant max-w-2xl">
            Oversee the platform&apos;s distinguished faculty. Manage instructional permissions and monitor active teaching schedules.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-secondary text-on_secondary px-6 py-2.5 rounded-full font-bold shadow-ambient flex items-center gap-2 hover:scale-105 active:scale-95 transition-all text-sm"
        >
          <UserPlus className="w-4 h-4" /> Recruit Faculty
        </button>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Faculty", value: teachers.length.toString(), icon: GraduationCap },
          { label: "Active Batches", value: teachers.reduce((acc, t) => acc + (t.batches || 0), 0).toString(), icon: BookOpen },
          { label: "Pending Apps", value: "—", icon: Activity },
        ].map((stat) => (
          <KnowledgeCard key={stat.label} className="p-6">
            <div className="flex gap-4 items-center">
              <div className="p-3 rounded-xl bg-surface_container_high text-secondary">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main List */}
        <div className="lg:col-span-2">
          <KnowledgeCard>
            <CardHeader className="flex justify-between items-center border-b border-outline_variant/10 pb-6 mb-0">
              <CardTitle>Faculty Directory</CardTitle>
              <div className="flex gap-2 items-center">
                {isSearchOpen && (
                  <input
                    type="text"
                    placeholder="Search faculty..."
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-3 py-1.5 text-sm bg-surface_container_highest border border-outline_variant/30 rounded-lg focus:outline-none focus:border-primary transition-colors text-on_surface animate-in slide-in-from-right-4 w-48"
                  />
                )}
                <button onClick={() => setIsSearchOpen(!isSearchOpen)} className={`p-2 border border-outline_variant/30 rounded-lg hover:bg-surface_container_high transition-colors ${isSearchOpen ? "bg-surface_container_high" : ""}`}>
                  <Search className="w-4 h-4 text-on_surface_variant" />
                </button>
                <button className="p-2 border border-outline_variant/30 rounded-lg hover:bg-surface_container_high transition-colors">
                  <Filter className="w-4 h-4 text-on_surface_variant" />
                </button>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <DataTable columns={columns} data={filteredTeachers} />
              <div className="p-6 flex justify-between items-center border-t border-outline_variant/10 bg-surface_container_lowest">
                <p className="text-xs text-on_surface_variant">Displaying 1-{filteredTeachers.length} of {teachers.length}</p>
                <div className="flex gap-3 items-center">
                  <SwitchButton3D>Prev</SwitchButton3D>
                  <span className="font-bold text-on_surface px-2">1</span>
                  <SwitchButton3D>Next</SwitchButton3D>
                </div>
              </div>
            </CardBody>
          </KnowledgeCard>
        </div>

        {/* Access Control Info */}
        <div className="space-y-6">
          <KnowledgeCard className="bg-surface_container_low border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-primary" /> Role Access
              </CardTitle>
            </CardHeader>
            <CardBody className="space-y-6">
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-on_surface flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Standard Faculty
                </h4>
                <p className="text-xs text-on_surface_variant leading-relaxed pl-3.5">
                  Classroom management, grading, and student communications.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-on_surface flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Department Head
                </h4>
                <p className="text-xs text-on_surface_variant leading-relaxed pl-3.5">
                  Curriculum oversight and department performance analytics.
                </p>
              </div>
            </CardBody>
          </KnowledgeCard>

          <KnowledgeCard className="bg-signature-gradient text-on_primary border-none shadow-ambient">
            <CardBody className="p-8">
              <h3 className="text-lg font-manrope font-bold mb-2">Performance Reviews</h3>
              <p className="text-sm text-on_primary_container mb-6 opacity-90 leading-relaxed">
                Mid-semester faculty appraisals are now open. Ensure all performance data is synced before generating the quarterly report.
              </p>
              <button className="w-full bg-surface text-primary py-3 rounded-full font-bold text-sm shadow-sm hover:bg-surface_bright transition-colors">
                Initiate Reviews
              </button>
            </CardBody>
          </KnowledgeCard>
        </div>
      </div>

      {/* MODAL: Recruit Faculty */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface_container_lowest w-full max-w-md rounded-3xl shadow-ambient border border-outline_variant/20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-outline_variant/10">
              <h2 className="text-xl font-bold text-on_surface font-manrope">Recruit New Faculty</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-on_surface_variant hover:text-on_surface p-2 rounded-full hover:bg-surface_container_high transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecruit} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Full Name</label>
                <input
                  type="text" required value={newFaculty.name}
                  onChange={e => setNewFaculty({ ...newFaculty, name: e.target.value })}
                  className="w-full bg-surface_container_highest border border-outline_variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-on_surface transition-colors"
                  placeholder="e.g. Dr. Alan Turing"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Official Email</label>
                <input
                  type="email" required value={newFaculty.email}
                  onChange={e => setNewFaculty({ ...newFaculty, email: e.target.value })}
                  className="w-full bg-surface_container_highest border border-outline_variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-on_surface transition-colors"
                  placeholder="name@academy.edu"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Title / Role (Optional)</label>
                <input
                  type="text" value={newFaculty.title}
                  onChange={e => setNewFaculty({ ...newFaculty, title: e.target.value })}
                  className="w-full bg-surface_container_highest border border-outline_variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-on_surface transition-colors"
                  placeholder="e.g. Senior Professor of AI"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Login Password</label>
                <div className="flex gap-2">
                  <input
                    type="text" required value={newFaculty.password}
                    onChange={e => setNewFaculty({ ...newFaculty, password: e.target.value })}
                    className="flex-1 bg-surface_container_highest border border-outline_variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-on_surface transition-colors font-mono"
                    placeholder="Set or Generate Password"
                  />
                  <button
                    type="button" onClick={generatePassword}
                    className="px-4 bg-primary/10 text-primary rounded-xl font-bold text-xs hover:bg-primary/20 transition-colors whitespace-nowrap"
                  >
                    Generate
                  </button>
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" disabled={saving} className="w-full btn-premium py-3.5 text-sm disabled:opacity-50">
                  {saving ? "Recruiting..." : "Recruit Faculty Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Credential Display */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface_container_lowest w-full max-w-sm rounded-2xl shadow-ambient border-2 border-primary/20 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <BadgeCheck className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-on_surface mb-2">Faculty Recruited!</h2>
              <p className="text-sm text-on_surface_variant mb-8">
                Share these credentials securely. They can also be retrieved from the Faculty Directory.
              </p>

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

      <footer className="pt-8 border-t border-outline_variant/20 flex flex-col md:flex-row justify-between items-center gap-4 text-outline text-[10px] font-bold uppercase tracking-widest">
        <span>© 2024 Azure Academy • Intellectual Elegance System</span>
        <div className="flex gap-6">
          <button className="hover:text-primary transition-colors">Privacy Policy</button>
          <button className="hover:text-primary transition-colors">Faculty Handbook</button>
          <button className="hover:text-primary transition-colors">System Health</button>
        </div>
      </footer>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
