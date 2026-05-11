"use client";

import { useEffect, useState } from "react";
import { KnowledgeCard } from "@/components/KnowledgeCard";
import { Download, Eye, FileText, Folder, LockKeyhole, UnlockKeyhole } from "lucide-react";
import { db } from "@/lib/db";

type ResourceFile = {
  id: string;
  name: string;
  folder: string;
  module: string;
  size: string;
  type: string;
  isUnlocked: boolean;
  lockedReason?: string;
};

type ResourceModule = {
  course: string;
  module: string;
  resources: ResourceFile[];
};

type NotesData = {
  folders: Array<{ name: string; fileCount: number; unlockedCount?: number; lockedCount?: number }>;
  modules?: ResourceModule[];
  recentFiles: ResourceFile[];
};

export default function NotesPage() {
  const [data, setData] = useState<NotesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await db.user.getNotes();
        setData(response);
      } catch (error) {
        console.error("Failed to fetch notes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, []);

  const openResource = async (file: ResourceFile) => {
    if (!file.isUnlocked || openingId) return;

    try {
      setOpeningId(file.id);
      const url = await db.user.openResource(file.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error: any) {
      alert(error.message || "This resource is locked right now.");
    } finally {
      setOpeningId(null);
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse text-on_surface_variant">Fetching materials...</div>;

  const folders = data?.folders || [];
  const modules = data?.modules || [];
  const recentFiles = data?.recentFiles || [];

  return (
    <div className="space-y-8 pb-10">
      <h1 className="text-4xl font-manrope font-bold tracking-tight mb-6">Notes & Materials</h1>

      {folders.length > 0 ? (
        <section>
          <h2 className="text-xl font-bold font-manrope mb-4 text-on_surface">Course Folders</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {folders.map((folder, i) => (
              <KnowledgeCard key={i} className="hover:border-primary/50 group">
                <div className="p-6 flex items-center gap-4">
                  <div className="p-4 rounded-xl bg-primary_fixed_dim/20 text-primary group-hover:scale-110 transition-transform">
                    <Folder className="w-8 h-8 fill-current opacity-80" />
                  </div>
                  <div>
                    <h3 className="font-bold text-on_surface group-hover:text-primary transition-colors">{folder.name}</h3>
                    <p className="text-sm text-on_surface_variant mt-1">
                      {folder.unlockedCount || 0}/{folder.fileCount} unlocked
                    </p>
                  </div>
                </div>
              </KnowledgeCard>
            ))}
          </div>
        </section>
      ) : (
        <div className="p-12 text-center bg-surface_container_low rounded-2xl border border-dashed border-outline_variant">
          <Folder className="w-12 h-12 text-on_surface_variant/30 mx-auto mb-4" />
          <p className="text-on_surface_variant font-medium">No course materials available yet.</p>
        </div>
      )}

      {modules.length > 0 && (
        <section>
          <h2 className="text-xl font-bold font-manrope mb-4 text-on_surface">Module Resources</h2>
          <div className="space-y-5">
            {modules.map((module, index) => (
              <KnowledgeCard key={`${module.course}-${module.module}-${index}`} className="p-5 border border-outline_variant/30">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-on_surface_variant font-bold">{module.course}</p>
                    <h3 className="font-bold text-on_surface">{module.module}</h3>
                  </div>
                  <span className="text-xs font-bold text-on_surface_variant">{module.resources.length} files</span>
                </div>
                <div className="space-y-2">
                  {module.resources.map((file) => (
                    <button
                      key={file.id}
                      type="button"
                      onClick={() => openResource(file)}
                      disabled={!file.isUnlocked || openingId === file.id}
                      title={file.isUnlocked ? "Open resource" : file.lockedReason}
                      className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-surface_container_lowest border border-outline_variant/20 text-left transition-all hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        {file.isUnlocked ? (
                          <UnlockKeyhole className="w-4 h-4 text-primary shrink-0" />
                        ) : (
                          <LockKeyhole className="w-4 h-4 text-outline shrink-0" />
                        )}
                        <span className="min-w-0">
                          <span className="block text-sm font-bold text-on_surface truncate">{file.name}</span>
                          <span className="block text-xs text-on_surface_variant truncate">
                            {file.type} / {file.isUnlocked ? "Ready" : file.lockedReason}
                          </span>
                        </span>
                      </span>
                      <Eye className="w-4 h-4 text-on_surface_variant shrink-0" />
                    </button>
                  ))}
                </div>
              </KnowledgeCard>
            ))}
          </div>
        </section>
      )}

      {recentFiles.length > 0 && (
        <section>
          <h2 className="text-xl font-bold font-manrope mb-4 text-on_surface">Recent Files</h2>
          <div className="space-y-3">
            {recentFiles.map((file, i) => (
              <KnowledgeCard key={i} className="flex justify-between items-center p-4 border border-outline_variant/30 hover:bg-surface_container_lowest transition-all hover:shadow-md">
                <div className="flex gap-4 items-center min-w-0">
                  <FileText className="w-6 h-6 text-secondary shrink-0" />
                  <div className="min-w-0">
                    <h4 className="font-bold text-on_surface text-sm truncate">{file.name}</h4>
                    <p className="text-xs text-on_surface_variant truncate">{file.folder} / {file.module} / {file.size}</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => openResource(file)}
                    disabled={!file.isUnlocked || openingId === file.id}
                    title={file.isUnlocked ? "View resource" : file.lockedReason}
                    className="text-on_surface_variant hover:text-primary p-2 rounded-full hover:bg-primary/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openResource(file)}
                    disabled={!file.isUnlocked || openingId === file.id}
                    title={file.isUnlocked ? "Download resource" : file.lockedReason}
                    className="text-on_surface_variant hover:text-primary p-2 rounded-full hover:bg-primary/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </KnowledgeCard>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
