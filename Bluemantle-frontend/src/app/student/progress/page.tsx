import { KnowledgeCard, CardHeader, CardTitle, CardBody } from "@/components/KnowledgeCard";
import { ProgressBar } from "@/components/ProgressBar";
import { Target, Trophy, Clock } from "lucide-react";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const data = await db.user.getStudentData();
  const courses = data.courses;

  const completed = courses.filter((c: any) => c.progress === 100).length;
  const avgCompletion = Math.round(courses.reduce((acc: number, curr: any) => acc + curr.progress, 0) / courses.length);

  return (
    <div className="space-y-8 pb-10">
      <h1 className="text-4xl font-manrope font-bold tracking-tight mb-6">Course Progress</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
         <KnowledgeCard className="flex items-center gap-4 bg-signature-gradient text-on_primary">
            <div className="p-4 rounded-xl bg-surface/20">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-on_primary_container uppercase tracking-wider">Completed Courses</p>
              <h3 className="text-3xl font-bold font-manrope">{completed}</h3>
            </div>
          </KnowledgeCard>
          <KnowledgeCard className="flex items-center gap-4">
            <div className="p-4 rounded-xl bg-surface_container_high text-secondary">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-outline uppercase tracking-wider">Avg Completion</p>
              <h3 className="text-3xl font-bold font-manrope">{avgCompletion}%</h3>
            </div>
          </KnowledgeCard>
          <KnowledgeCard className="flex items-center gap-4">
            <div className="p-4 rounded-xl bg-surface_container_high text-primary_fixed_variant">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-outline uppercase tracking-wider">Study Time</p>
              <h3 className="text-3xl font-bold font-manrope">42 Hrs</h3>
            </div>
          </KnowledgeCard>
      </div>

      <KnowledgeCard>
        <CardHeader><CardTitle>Detailed Course Metrics</CardTitle></CardHeader>
        <CardBody className="space-y-8">
          {courses.map((course: any) => (
            <div key={course.id} className="flex flex-col md:flex-row gap-6 items-center">
              <div className="w-full md:w-1/3">
                <h4 className="font-bold text-on_surface text-lg">{course.name}</h4>
                <p className="text-sm text-on_surface_variant mt-1">Modules Completed: {course.modulesCompleted}/{course.totalModules}</p>
              </div>
              <div className="w-full md:w-2/3 flex items-center gap-4">
                <div className="flex-1">
                  <ProgressBar progress={course.progress} key={course.name} />
                </div>
                <span className="font-manrope font-bold text-xl min-w-[60px] text-right text-primary">
                  {course.progress}%
                </span>
                {course.progress === 100 && (
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex-shrink-0">
                    Graduated
                  </span>
                )}
              </div>
            </div>
          ))}
        </CardBody>
      </KnowledgeCard>
    </div>
  );
}
