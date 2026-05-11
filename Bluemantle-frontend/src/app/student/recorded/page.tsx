"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { KnowledgeCard, CardBody } from "@/components/KnowledgeCard";
import { PlayCircle, Clock, BookOpen, ChevronRight } from "lucide-react";
import { db } from "@/lib/db";

export default function CourseGallery() {
  const [data, setData] = useState<any>(null);
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reg, studentData] = await Promise.all([
          db.user.getInstitutionalData(),
          db.user.getStudentData()
        ]);
        setData(reg);
        setStudentId(studentData.profile.id);
      } catch (error) {
        console.error("Failed to fetch recorded data:", error);
      }
    };
    fetchData();
  }, []);

  if (!data || !studentId) return <div className="p-8 text-center animate-pulse text-on_surface_variant font-medium">Initializing Academy Library...</div>;

  const catalog = data.courseCatalog || [];
  const progressData = data.userProgress?.[studentId] || {};

  return (
    <div className="space-y-10 pb-20">
      <header>
        <h1 className="text-4xl font-manrope font-bold tracking-tight mb-2">Recorded Academy</h1>
        <p className="text-on_surface_variant">Select a course to continue your learning journey.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {catalog.map((course: any) => {
          const courseProgress = progressData[course.id];
          const totalChapters = course.modules.reduce((acc: number, mod: any) => acc + mod.chapters.length, 0);
          
          // Basic progress calc (mock)
          const isStarted = !!courseProgress;

          return (
            <Link key={course.id} href={`/student/recorded/${course.id}`}>
              <KnowledgeCard className="group overflow-hidden hover:border-primary/40 transition-all cursor-pointer h-full flex flex-col">
                <div className="aspect-video bg-surface_container_highest relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                  <div className="absolute bottom-4 left-4 z-20 text-white font-bold text-lg flex items-center gap-2">
                    <PlayCircle className="w-5 h-5 text-primary" />
                    {isStarted ? "Resume Learning" : "Start Course"}
                  </div>
                </div>
                <CardBody className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded">
                      {course.instructor}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-on_surface_variant">
                      <BookOpen className="w-3 h-3" />
                      {course.modules.length} Modules
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold font-manrope text-on_surface group-hover:text-primary transition-colors mb-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-on_surface_variant line-clamp-2 mb-6">
                    {course.description}
                  </p>

                  <div className="mt-auto pt-6 border-t border-outline_variant/20">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-on_surface_variant">
                        {isStarted ? "In Progress" : "Not Started"}
                      </span>
                      <span className="text-xs font-bold text-primary">
                        {isStarted ? `${courseProgress.completion}%` : "0%"}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-surface_container_highest rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-1000" 
                        style={{ width: isStarted ? `${courseProgress.completion}%` : '0%' }} 
                      />
                    </div>
                  </div>
                </CardBody>
              </KnowledgeCard>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
