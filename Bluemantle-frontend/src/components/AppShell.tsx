import { SidebarNavigation, UserRole } from "./SidebarNavigation";
import { GlassHeader } from "./GlassHeader";
import { DNABackground } from "./DNABackground";
import { DashboardAmbience } from "./DashboardAmbience";
import { MarketHeartbeat } from "./MarketHeartbeat";

export function AppShell({ 
  children, 
  title = "Dashboard",
  className,
  role = "student"
}: { 
  children: React.ReactNode; 
  title?: string;
  className?: string;
  role?: UserRole;
}) {
  return (
    <div className="flex flex-col min-h-screen relative w-full overflow-hidden bg-surface/60">
      <DashboardAmbience />
      <MarketHeartbeat />

      {/* Top Navigation Bar */}
      <SidebarNavigation role={role} />
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative w-full pb-20">
        <div className="p-4 md:p-8 relative z-10 mx-auto max-w-7xl w-full flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
