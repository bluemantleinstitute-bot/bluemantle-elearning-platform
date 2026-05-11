import { NextResponse } from "next/server";
import { serverDb } from "@/lib/server-db";

export async function GET() {
  const data = serverDb.read();
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const { action, payload } = await request.json();
  
  switch (action) {
    case "ignite":
      serverDb.igniteSession(payload.batchId, true);
      return NextResponse.json({ success: true, message: "Session Ignited" });
    
    case "halt":
      serverDb.igniteSession(payload.batchId, false);
      return NextResponse.json({ success: true, message: "Session Halted" });

    case "suspend":
      serverDb.updateStudentStatus(payload.studentId, "suspended");
      return NextResponse.json({ success: true, message: "Student Suspended" });

    case "reactivate":
      serverDb.updateStudentStatus(payload.studentId, "active");
      return NextResponse.json({ success: true, message: "Student Reactivated" });
    
    case "appeal":
      serverDb.submitAppeal(payload);
      return NextResponse.json({ success: true, message: "Appeal Submitted" });

    case "resolveAppeal":
      serverDb.resolveAppeal(payload.appealId, payload.decision);
      return NextResponse.json({ success: true, message: "Appeal Resolved" });

    case "updateProgress":
      serverDb.updateProgress(payload.studentId, payload.courseId, payload.moduleId, payload.chapterId);
      return NextResponse.json({ success: true, message: "Progress Updated" });

    case "updateCatalog":
      serverDb.updateCourseCatalog(payload.catalog);
      return NextResponse.json({ success: true, message: "Catalog Updated" });

    default:
      return NextResponse.json({ success: false, message: "Invalid Action" }, { status: 400 });
  }
}
