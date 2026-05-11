import { cn } from "@/lib/utils";
import { Bell, Search } from "lucide-react";

export function GlassHeader({ title = "Dashboard" }: { title?: string }) {
  return (
    <header className="glass-header h-20 px-10 flex items-center justify-between shadow-ambient rounded-b-2xl mx-6 translate-y-4">
      <h2 className="text-2xl font-manrope font-bold text-on_surface">{title}</h2>
      
      <div className="flex items-center gap-6">
        <div className="relative group">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-on_surface_variant group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search classes, materials..." 
            className="bg-surface_container_high text-on_surface placeholder:text-on_surface_variant/60 rounded-full pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary_fixed_dim transition-all w-64 focus:w-80"
          />
        </div>
        
        <button className="relative w-10 h-10 rounded-full bg-surface_container flex items-center justify-center hover:bg-surface_container_high transition-colors text-on_surface_variant">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-error rounded-full ring-2 ring-surface"></span>
        </button>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary_container text-on_primary_container flex items-center justify-center font-bold">
            JD
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-on_surface">John Doe</p>
            <p className="text-xs text-on_surface_variant">Student</p>
          </div>
        </div>
      </div>
    </header>
  );
}
