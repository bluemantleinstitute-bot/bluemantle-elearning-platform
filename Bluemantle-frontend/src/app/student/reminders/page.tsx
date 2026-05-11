import { KnowledgeCard, CardHeader, CardTitle, CardBody } from "@/components/KnowledgeCard";
import { Flag, Bell, Video } from "lucide-react";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function RemindersPage() {
  const data = await db.user.getStudentData();

  return (
    <div className="space-y-8 pb-10">
      <h1 className="text-4xl font-manrope font-bold tracking-tight mb-6">Reminders</h1>
      
      <KnowledgeCard className="bg-surface_container_lowest">
        <CardBody className="p-2 space-y-2">
          {data.reminders.map((rem: any) => (
            <div key={rem.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface rounded-xl p-4 border border-outline_variant/30 hover:border-primary/30 transition-all group">
              <div className="flex gap-4 items-center">
                <div className={`p-3 rounded-full flex items-center justify-center ${
                  rem.status === 'error' ? 'bg-error/10 text-error' :
                  rem.status === 'warning' ? 'bg-warning/10 text-warning' :
                  rem.status === 'info' ? 'bg-primary/10 text-primary' :
                  'bg-secondary/10 text-secondary'
                }`}>
                  {rem.status === 'error' ? <Flag className="w-6 h-6" /> : 
                   rem.status === 'warning' ? <Bell className="w-6 h-6" /> :
                   rem.status === 'info' ? <Video className="w-6 h-6" /> :
                   <Bell className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-on_surface mb-1 group-hover:text-primary transition-colors">{rem.title}</h3>
                  <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-sm inline-block">
                    {rem.type}
                  </span>
                </div>
              </div>
              <div className="text-right text-sm font-semibold text-on_surface_variant">
                {rem.date}
              </div>
            </div>
          ))}
        </CardBody>
      </KnowledgeCard>
    </div>
  );
}
