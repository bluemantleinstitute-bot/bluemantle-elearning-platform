import { KnowledgeCard, CardBody } from "@/components/KnowledgeCard";
import { DataTable } from "@/components/DataTable";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const data = await db.user.getStudentData();
  const records = await db.user.getAttendanceRecords();
  
  const att = data.attendance;

  const formattedRecords = records.map((r: any) => ({
    date: new Date(r.classId.date).toLocaleDateString(),
    class: r.classId.topic,
    teacher: data.profile.teacher, // Assuming same teacher for batch
    status: r.status.charAt(0).toUpperCase() + r.status.slice(1)
  }));

  return (
    <div className="space-y-8 pb-10">
      <h1 className="text-4xl font-manrope font-bold tracking-tight mb-6">Attendance Record</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <KnowledgeCard className="bg-surface_container_high shadow-none border-none text-center p-6">
          <p className="text-sm font-bold text-outline uppercase tracking-wider mb-2">Total Classes</p>
          <span className="text-4xl font-manrope font-bold text-on_surface">{att.totalClasses}</span>
        </KnowledgeCard>
        <KnowledgeCard className="bg-surface_container_high shadow-none border-none text-center p-6">
          <p className="text-sm font-bold text-outline uppercase tracking-wider mb-2">Attended</p>
          <span className="text-4xl font-manrope font-bold text-primary">{att.attended}</span>
        </KnowledgeCard>
        <KnowledgeCard className="bg-surface_container_high shadow-none border-none text-center p-6">
          <p className="text-sm font-bold text-outline uppercase tracking-wider mb-2">Attendance Rate</p>
          <span className="text-4xl font-manrope font-bold text-secondary">{att.rate}</span>
        </KnowledgeCard>
      </div>

      <KnowledgeCard>
        <CardBody className="p-0 overflow-hidden">
          {formattedRecords.length === 0 ? (
            <div className="p-12 text-center text-on_surface_variant italic">No attendance records found.</div>
          ) : (
            <DataTable 
              columns={[
                { key: "date", header: "Date" },
                { key: "class", header: "Class" },
                { key: "teacher", header: "Teacher" },
                { key: "status", header: "Status", render: (val) => (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    val === 'Present' ? 'bg-primary/10 text-primary' : 
                    val === 'Late' ? 'bg-secondary/10 text-secondary' : 'bg-error/10 text-error'
                  }`}>
                    {val}
                  </span>
                )},
              ]} 
              data={formattedRecords} 
            />
          )}
        </CardBody>
      </KnowledgeCard>
    </div>
  );
}
