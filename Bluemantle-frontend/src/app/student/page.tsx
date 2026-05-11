import { KnowledgeCard, CardHeader, CardTitle, CardBody } from "@/components/KnowledgeCard";
import { ProgressBar } from "@/components/ProgressBar";
import { Video, Clock, Flag, Bell, Activity, PlayCircle, Shield, Smartphone, TrendingUp, Newspaper, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { LinkedDevicesManager } from "@/components/LinkedDevicesManager";
import { MotivationalSpinner } from "@/components/MotivationalSpinner";
import { SessionRefresher } from "@/components/SessionRefresher";
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

export default async function StudentDashboard() {
  let data: any = null;
  let errorMsg = "";

  try {
    data = await db.user.getStudentData();
  } catch (error: any) {
    console.error("Dashboard data fetch failed:", error);
    errorMsg = "Offline - Sync Pending";
    // Provide minimal structure so page doesn't break
    data = { 
      profile: { name: "Student", level: "...", totalXP: "0", joined: "...", batch: "...", teacher: "..." },
      upcomingLiveClass: null,
      courses: [],
      announcements: [],
      reminders: [],
      marketNews: [],
      recordings: [],
      attendance: { rate: "0%" }
    };
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
      <SessionRefresher interval={20000} />
      
      {/* LEFT COLUMN: Main Dashboard Content (Spans 2 columns on large screens) */}
      <div className="lg:col-span-2 space-y-8">
        
        {/* Top Section - Live Class Focus */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <MotivationalSpinner />
            <div className="flex gap-2">
              {errorMsg && (
                <div className="px-2 py-0.5 rounded-full bg-error/10 text-error text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border border-error/20">
                   <AlertCircle className="w-3 h-3" /> {errorMsg}
                </div>
              )}
              <div className="px-2 py-0.5 rounded-full bg-error/10 text-error text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border border-error/20">
                 <span className="animate-pulse w-1.5 h-1.5 rounded-full bg-error" /> {data.upcomingLiveClass ? "Live Soon" : "No Live Sessions"}
              </div>
            </div>
          </div>
          
          <div className="relative overflow-hidden rounded-3xl bg-surface_container_lowest border border-outline_variant/20 shadow-ambient group">
            {/* Ambient Background Glows */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-[80px] group-hover:bg-primary/30 group-hover:scale-110 transition-all duration-700 pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-secondary/15 rounded-full blur-[60px] group-hover:bg-secondary/25 group-hover:scale-110 transition-all duration-700 pointer-events-none" />

          {data.upcomingLiveClass ? (
              <div className="relative z-10 p-8 lg:p-10 flex flex-col md:flex-row gap-8 items-center justify-between">
                <div className="flex-1 space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      {data.upcomingLiveClass.status === 'live' ? (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-error/10 text-error text-[10px] font-bold uppercase tracking-wider border border-error/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse" /> Live Now
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/20">
                          Scheduled
                        </span>
                      )}
                    </div>
                    <h3 className="text-3xl lg:text-5xl font-manrope font-extrabold text-on_surface leading-tight mb-3">
                      {data.upcomingLiveClass.title}
                    </h3>
                    <div className="flex items-center gap-2 text-on_surface_variant text-sm font-semibold">
                      <span>{data.upcomingLiveClass.instructor}</span>
                      <span className="text-outline_variant">•</span>
                      <span className="px-2.5 py-1 rounded-md bg-surface_container_high border border-outline_variant/30 text-primary">{data.upcomingLiveClass.batch}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center pt-2">
                    {data.upcomingLiveClass.status === 'live' ? (
                      <Link href={`/student/live/${data.upcomingLiveClass.id}/zoom`} className="w-full sm:w-auto">
                        <button className="btn-premium w-full sm:w-auto hover:shadow-[0_0_30px_rgba(0,162,207,0.4)] transition-all flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                            <Video className="w-3.5 h-3.5" />
                          </div>
                          Enter Live Room
                        </button>
                      </Link>
                    ) : data.upcomingLiveClass.status === 'finished' ? (
                      <button disabled className="w-full sm:w-auto px-6 py-3 rounded-full bg-surface_container border border-outline_variant/30 text-on_surface_variant text-sm font-bold opacity-60 cursor-not-allowed flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4" />
                        Session Finished
                      </button>
                    ) : (
                      <button disabled className="w-full sm:w-auto px-6 py-3 rounded-full bg-surface_container border border-outline_variant/30 text-on_surface_variant text-sm font-bold opacity-60 cursor-not-allowed flex items-center gap-3">
                        <Video className="w-4 h-4" />
                        Available When Live
                      </button>
                    )}
                    
                    <div className="px-5 py-3 rounded-full bg-surface_container border border-outline_variant/30 text-sm font-bold text-on_surface flex items-center gap-3 w-full sm:w-auto">
                      <Clock className="w-4 h-4 text-secondary" />
                      {data.upcomingLiveClass.status === 'live' ? 'In Progress' : <>Commences in <span className="text-primary font-extrabold tracking-wide ml-1">{data.upcomingLiveClass.countdown}</span></>}
                    </div>
                  </div>
                </div>

                {/* Right Side Visual Element */}
                <div className="hidden md:flex flex-shrink-0 relative">
                   <div className="w-40 h-40 relative">
                     <svg className="absolute inset-0 w-full h-full animate-[spin_20s_linear_infinite] text-primary/30" viewBox="0 0 100 100">
                       <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="10 10" />
                     </svg>
                     <svg className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] animate-[spin_15s_linear_infinite_reverse] text-secondary/30" viewBox="0 0 100 100">
                       <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="30 15" />
                     </svg>
                     
                     <div className="absolute inset-0 flex items-center justify-center">
                       <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-secondary shadow-[0_0_40px_rgba(0,162,207,0.4)] flex items-center justify-center transition-transform hover:scale-105 duration-300">
                         <PlayCircle className="w-10 h-10 text-white translate-x-0.5" />
                       </div>
                     </div>
                   </div>
                </div>
              </div>
            ) : (
              <div className="relative z-10 p-10 flex flex-col items-center justify-center text-center space-y-4">
                <div className="p-4 rounded-full bg-surface_container_highest border border-outline_variant/20">
                   <Video className="w-8 h-8 text-outline" />
                </div>
                <h3 className="text-2xl font-bold font-manrope text-on_surface">No sessions currently scheduled</h3>
                <p className="text-on_surface_variant max-w-sm">Your upcoming live lectures will appear here once they are assigned to your batch.</p>
              </div>
            )}
          </div>
        </section>

        {/* Middle Section - Learning Overview */}
        <section>
          <h2 className="text-xl font-bold font-manrope mb-4 text-on_surface">Learning Overview</h2>
          <div className="grid grid-cols-1 gap-6">
            <KnowledgeCard className="h-full">
              <CardHeader><CardTitle>Course Progress</CardTitle></CardHeader>
              <CardBody>
                <div className="space-y-6">
                  {data.courses.map((course: any) => (
                    <div key={course.id}>
                      <div className="flex justify-between text-sm mb-1 font-semibold text-on_surface">
                        <span className="truncate pr-2">{course.name}</span>
                        <span>{course.progress}%</span>
                      </div>
                      <ProgressBar progress={course.progress} />
                    </div>
                  ))}
                </div>
              </CardBody>
            </KnowledgeCard>
          </div>
        </section>

        {/* Bottom Section - Activity Updates */}
        <section>
          <h2 className="text-xl font-bold font-manrope mb-4 text-on_surface">Activity Updates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <KnowledgeCard>
              <CardHeader><CardTitle>Latest Announcements</CardTitle></CardHeader>
              <CardBody className="space-y-4">
                {data.announcements.map((ann: any) => (
                  <div key={ann.id} className="flex gap-4">
                    <div className="p-2 rounded-full bg-primary_container text-primary h-fit">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-on_surface text-sm">{ann.title}</h5>
                      <p className="text-sm text-on_surface_variant mt-1">{ann.content}</p>
                      <span className="text-xs text-outline mt-2 block">{ann.time}</span>
                    </div>
                  </div>
                ))}
              </CardBody>
            </KnowledgeCard>
            
            <Link href="/student/recorded" className="group block h-full">
              <KnowledgeCard className="h-full group-hover:border-primary/50 transition-colors">
                <CardHeader><CardTitle className="group-hover:text-primary transition-colors">Recently Added Recordings</CardTitle></CardHeader>
                <CardBody className="space-y-4">
                  {data.recordings.slice(0, 2).map((rec: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-lg border border-outline_variant/30 group-hover:bg-surface_container_low transition-colors">
                      <div className="flex gap-3 items-center">
                        <PlayCircle className="w-8 h-8 text-primary" />
                        <div>
                          <h5 className="font-bold text-sm text-on_surface line-clamp-1">{rec.title}</h5>
                          <span className="text-xs text-outline">{rec.time}</span>
                        </div>
                      </div>
                      <span className="text-xs font-semibold bg-surface_container_high px-2 py-1 rounded-sm text-on_surface_variant flex-shrink-0">{rec.duration}</span>
                    </div>
                  ))}
                </CardBody>
              </KnowledgeCard>
            </Link>
          </div>
        </section>

        {/* Bottom-Most Section - Market Intelligence */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-bold font-manrope text-on_surface">Market Intelligence</h2>
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <KnowledgeCard className="bg-surface_container_low border-none">
            <CardBody className="space-y-4">
              {data.marketNews.map((news: any) => (
                <div key={news.id} className="flex gap-4 p-4 bg-surface_container_highest border border-outline_variant/30 rounded-xl hover:border-primary/50 transition-colors cursor-pointer group">
                  <div className="w-12 h-12 flex-shrink-0 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    {news.trending ? <TrendingUp className="w-6 h-6 text-primary" /> : <Newspaper className="w-6 h-6 text-primary" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-sm inline-block mb-1">{news.tag}</span>
                      <span className="text-xs text-on_surface_variant">{news.time}</span>
                    </div>
                    <h4 className="font-bold text-sm text-on_surface mb-1 group-hover:text-primary transition-colors">{news.title}</h4>
                    <p className="text-xs text-on_surface_variant leading-relaxed line-clamp-2">{news.abstract}</p>
                  </div>
                </div>
              ))}
            </CardBody>
          </KnowledgeCard>
        </section>
      </div>

      {/* RIGHT COLUMN: Profile & Settings */}
      <div className="lg:col-span-1 space-y-8">
        {/* Profile Card */}
        <KnowledgeCard className="bg-surface_container_low">
          <CardHeader className="text-center mb-6">
            <div className="w-24 h-24 rounded-full bg-signature-gradient text-on_primary flex items-center justify-center font-manrope font-bold text-4xl shadow-ambient mx-auto mb-4">
              {data.profile.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <h3 className="text-2xl font-bold font-manrope text-on_surface">{data.profile.name}</h3>
            <p className="text-primary font-semibold text-sm">{data.profile.level}</p>
            
            <div className="mt-4 inline-flex items-center gap-2 bg-surface_container_highest border border-outline_variant/30 text-on_surface_variant text-xs font-bold px-4 py-1.5 rounded-full shadow-sm">
              <span className="text-primary">{data.profile.batch}</span>
              <span className="w-1 h-1 rounded-full bg-outline_variant"></span>
              <span>{data.profile.teacher}</span>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex justify-between p-3 bg-surface_container_highest rounded-lg">
               <span className="text-sm font-semibold text-on_surface_variant">Total XP</span>
               <span className="text-sm font-bold text-on_surface">{data.profile.totalXP}</span>
            </div>
            <div className="flex justify-between p-3 bg-surface_container_highest rounded-lg">
               <span className="text-sm font-semibold text-on_surface_variant">Joined</span>
               <span className="text-sm font-bold text-on_surface">{data.profile.joined}</span>
            </div>
            <div className="flex justify-between p-3 bg-surface_container_highest rounded-lg relative overflow-hidden group hover:cursor-pointer">
              <Link href="/student/attendance" className="absolute inset-0 z-10" />
               <span className="text-sm font-semibold text-on_surface_variant">Attendance Rate</span>
               <span className="text-sm font-bold text-secondary">{data.attendance.rate}</span>
            </div>
          </CardBody>
        </KnowledgeCard>

        {/* Study Reminders */}
        <KnowledgeCard>
          <CardHeader><CardTitle>Study Reminders</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            {data.reminders.map((rem: any) => (
              <div key={rem.id} className="flex gap-4 items-start bg-surface_container_lowest p-4 rounded-xl border border-outline_variant/20 hover:border-primary/20 transition-colors">
                {rem.status === 'error' ? (
                   <Flag className="w-5 h-5 text-error mt-0.5 flex-shrink-0" />
                ) : rem.status === 'warning' ? (
                   <Bell className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
                ) : rem.status === 'info' ? (
                   <Video className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                ) : (
                   <Bell className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <div className="flex gap-2 items-center mb-1">
                    <h5 className="font-bold text-sm text-on_surface">{rem.title}</h5>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-sm inline-block mb-1">{rem.type}</span>
                  <p className="text-xs text-on_surface_variant">{rem.date}</p>
                </div>
              </div>
            ))}
          </CardBody>
        </KnowledgeCard>

        {/* Security Settings */}
        <KnowledgeCard>
          <CardHeader><CardTitle>Account Settings</CardTitle></CardHeader>
          <CardBody className="space-y-4">
             <button className="flex items-center gap-3 w-full p-4 border border-outline_variant/30 rounded-xl hover:bg-surface_container_lowest transition-all text-left">
               <div className="p-2 rounded-full bg-surface_container_high text-primary"><Shield className="w-5 h-5" /></div>
               <div>
                 <h5 className="font-bold text-on_surface">Change Password</h5>
                 <p className="text-xs text-on_surface_variant mt-0.5">Keep your account secure</p>
               </div>
             </button>
          </CardBody>
        </KnowledgeCard>

        {/* Linked Devices */}
        <LinkedDevicesManager initialDevice={data.activeDevice} />
      </div>

    </div>
  );
}
