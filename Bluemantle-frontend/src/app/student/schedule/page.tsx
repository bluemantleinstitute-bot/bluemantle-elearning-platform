import { KnowledgeCard, CardHeader, CardTitle, CardBody } from "@/components/KnowledgeCard";
import { DataTable } from "@/components/DataTable";
import { Calendar, Filter, GripHorizontal, List } from "lucide-react";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ClassSchedulePage() {
  const data = await db.user.getStudentData();

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-4xl font-manrope font-bold tracking-tight">Class Schedule</h1>
        
        <div className="flex bg-surface_container_high rounded-lg p-1">
          <button className="px-4 py-2 bg-surface text-primary rounded-md font-bold shadow-sm text-sm flex items-center gap-2">
            <List className="w-4 h-4" /> List View
          </button>
          <button className="px-4 py-2 text-on_surface_variant hover:text-on_surface rounded-md font-bold text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Weekly Calendar
          </button>
        </div>
      </div>
      
      <KnowledgeCard>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Upcoming Classes</CardTitle>
          <button className="text-sm font-bold text-on_surface_variant flex items-center gap-2 border border-outline_variant/30 px-3 py-1.5 rounded-md hover:bg-surface_container_lowest transition-colors">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </CardHeader>
        <CardBody>
          <DataTable 
            columns={[
              { key: "date", header: "Date" },
              { key: "time", header: "Time" },
              { key: "teacher", header: "Teacher" },
              { key: "batch", header: "Batch" },
              { key: "topic", header: "Topic" },
            ]} 
            data={data.schedule} 
          />
        </CardBody>
      </KnowledgeCard>
    </div>
  );
}
