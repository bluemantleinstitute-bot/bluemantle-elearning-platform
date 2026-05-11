"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { KnowledgeCard, CardBody } from "@/components/KnowledgeCard";
import { PlayCircle, Clock, Calendar, Video } from "lucide-react";
import { db } from "@/lib/db";

export default function LiveRecordingsGallery() {
  const [recordings, setRecordings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const classes = await db.user.getLiveClasses();
        const now = Date.now();
        const recordedClasses = classes.filter((c: any) => {
          const recordingUrl = c.recordingUrl || c.zoomCloudRecordingUrl;
          const expiry = c.recordingExpiryDate
            ? new Date(c.recordingExpiryDate).getTime()
            : new Date(c.date).getTime() + 7 * 24 * 60 * 60 * 1000;
          return c.status === "recorded" && recordingUrl && expiry >= now;
        });
        setRecordings(recordedClasses);
      } catch (error) {
        console.error("Failed to fetch recorded classes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center animate-pulse text-on_surface_variant font-medium">Loading Live Archives...</div>;

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-500">
      <header>
        <h1 className="text-4xl font-manrope font-bold tracking-tight mb-2">Live Archives</h1>
        <p className="text-on_surface_variant">Catch up on live sessions you missed. Remember, watching within 7 days marks you as Late instead of Absent.</p>
      </header>

      {recordings.length === 0 ? (
        <div className="relative overflow-hidden rounded-3xl bg-surface_container_lowest border border-outline_variant/20 shadow-ambient p-10 flex flex-col items-center justify-center text-center space-y-4">
          <div className="p-4 rounded-full bg-surface_container_highest border border-outline_variant/20">
             <Video className="w-8 h-8 text-outline" />
          </div>
          <h3 className="text-2xl font-bold font-manrope text-on_surface">No recordings available</h3>
          <p className="text-on_surface_variant max-w-sm">Past live sessions will appear here once the teacher uploads the recording.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {recordings.map((rec: any) => {
            const classDate = new Date(rec.date);
            const now = new Date();
            const expiryDate = rec.recordingExpiryDate
              ? new Date(rec.recordingExpiryDate)
              : new Date(classDate.getTime() + 7 * 24 * 60 * 60 * 1000);
            const remainingDays = Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

            return (
              <Link key={rec._id} href={`/student/live/recordings/${rec._id}`}>
                <KnowledgeCard className="group overflow-hidden hover:border-primary/40 transition-all cursor-pointer h-full flex flex-col">
                  <div className="aspect-video bg-surface_container_highest relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                    <div className="absolute bottom-4 left-4 z-20 text-white font-bold text-lg flex items-center gap-2">
                      <PlayCircle className="w-5 h-5 text-primary" />
                      Watch Recording
                    </div>
                  </div>
                  <CardBody className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded">
                        {rec.batchId?.name || "Live Session"}
                      </span>
                      {remainingDays > 0 && (
                        <span className="text-[10px] font-bold text-secondary uppercase tracking-widest bg-secondary/10 px-2 py-0.5 rounded animate-pulse">
                          {remainingDays}d left
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-bold font-manrope text-on_surface group-hover:text-primary transition-colors mb-2">
                      {rec.topic}
                    </h3>
                    
                    <div className="mt-auto pt-6 border-t border-outline_variant/20 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-on_surface_variant">
                        <Calendar className="w-4 h-4" />
                        {classDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-on_surface_variant">
                        <Clock className="w-4 h-4" />
                        {rec.duration || 60} mins
                      </div>
                    </div>
                  </CardBody>
                </KnowledgeCard>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
