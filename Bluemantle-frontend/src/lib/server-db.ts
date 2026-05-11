import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "src/data/registry.json");

export interface RegistryData {
  students: any[];
  batches: any[];
  schedule: any[];
  appeals: any[];
  courseCatalog: any[];
  userProgress: Record<string, Record<string, any>>;
}

export const serverDb = {
  read: (): RegistryData => {
    try {
      const data = fs.readFileSync(DB_PATH, "utf8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Error reading registry:", error);
      return { students: [], batches: [], schedule: [], appeals: [], courseCatalog: [], userProgress: {} };
    }
  },

  write: (data: RegistryData) => {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
    } catch (error) {
      console.error("Error writing registry:", error);
    }
  },

  updateStudentStatus: (id: string, status: string) => {
    const data = serverDb.read();
    const index = data.students.findIndex((s) => s.id === id);
    if (index !== -1) {
      data.students[index].status = status;
      serverDb.write(data);
    }
  },

  igniteSession: (batchId: string, isLive: boolean) => {
    const data = serverDb.read();
    const index = data.batches.findIndex((b) => b.id === batchId);
    if (index !== -1) {
      data.batches[index].isLive = isLive;
      serverDb.write(data);
    }
  },

  submitAppeal: (appeal: any) => {
    const data = serverDb.read();
    data.appeals.push({
      ...appeal,
      id: `APP-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: "pending"
    });
    serverDb.write(data);
  },

  resolveAppeal: (appealId: string, decision: "approved" | "denied") => {
    const data = serverDb.read();
    const appealIndex = data.appeals.findIndex((a) => a.id === appealId);
    if (appealIndex !== -1) {
      const appeal = data.appeals[appealIndex];
      appeal.status = decision;
      
      if (decision === "approved") {
        const studentIndex = data.students.findIndex((s) => s.id === appeal.studentId);
        if (studentIndex !== -1) {
          data.students[studentIndex].status = "active";
        }
      }
      serverDb.write(data);
    }
  },

  updateProgress: (studentId: string, courseId: string, moduleId: string, chapterId: string) => {
    const data = serverDb.read();
    if (!data.userProgress) data.userProgress = {};
    if (!data.userProgress[studentId]) data.userProgress[studentId] = {};
    
    data.userProgress[studentId][courseId] = {
      lastModuleId: moduleId,
      lastChapterId: chapterId,
      updatedAt: new Date().toISOString()
    };
    
    serverDb.write(data);
  },

  updateCourseCatalog: (catalog: any[]) => {
    const data = serverDb.read();
    data.courseCatalog = catalog;
    serverDb.write(data);
  }
};
