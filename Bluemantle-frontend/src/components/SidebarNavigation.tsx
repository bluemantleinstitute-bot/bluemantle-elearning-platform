"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { 
  LayoutDashboard, Video, PlayCircle, Calendar, FileText, ClipboardCheck, 
  Target, BellRing, Users, BookOpen, DollarSign, Smartphone, 
  GraduationCap, UploadCloud, UserCircle, MessageSquare, ShieldAlert,
  Layers, Lock, LifeBuoy
} from "lucide-react";

export const STUDENT_NAV_ITEMS = [
  { name: "Dashboard", href: "/student", icon: LayoutDashboard },
  { name: "Live Classes", href: "/student/live", icon: Video },
  { name: "Live Archives", href: "/student/live/recordings", icon: PlayCircle },
  { name: "Recorded", href: "/student/recorded", icon: BookOpen },
  { name: "Schedule", href: "/student/schedule", icon: Calendar },
  { name: "Materials", href: "/student/notes", icon: FileText },
  { name: "Reminders", href: "/student/reminders", icon: BellRing },
  { name: "Doubts", href: "/student/qa", icon: MessageSquare },
  { name: "Complaint Box", href: "/student/complaints", icon: LifeBuoy },
];

export const PROFILE_MENU_ITEMS = [
  { name: "My Progress", href: "/student/progress", icon: Target },
  { name: "Attendance", href: "/student/attendance", icon: ClipboardCheck },
];

export const ADMIN_NAV_ITEMS = [
  { name: "Overview",    href: "/admin",              icon: LayoutDashboard },
  { name: "Batches",     href: "/admin/batches",      icon: Layers          },
  { name: "Students",    href: "/admin/students",     icon: Users           },
  { name: "Teachers",    href: "/admin/teachers",     icon: GraduationCap   },
  { name: "Courses",     href: "/admin/courses",      icon: BookOpen        },
  { name: "Live",        href: "/admin/live",         icon: Video           },
  { name: "Recordings",  href: "/admin/recordings",   icon: PlayCircle      },
  { name: "Attendance",  href: "/admin/attendance",   icon: ClipboardCheck  },
  { name: "Payments",    href: "/admin/payments",     icon: DollarSign      },
  { name: "Devices",     href: "/admin/devices",      icon: Smartphone      },
  { name: "QA Reports",  href: "/admin/qa",           icon: MessageSquare   },
];

export const TEACHER_NAV_ITEMS = [
  { name: "Dashboard", href: "/teacher", icon: LayoutDashboard },
  { name: "Courses", href: "/teacher/courses", icon: BookOpen },
  { name: "Schedule", href: "/teacher/schedule", icon: Calendar },
  { name: "Start Live", href: "/teacher/live", icon: Video },
  { name: "Attendance", href: "/teacher/attendance", icon: ClipboardCheck },
  { name: "Students", href: "/teacher/students", icon: Users },
  { name: "Materials", href: "/teacher/materials", icon: UploadCloud },
  { name: "Doubts Inbox", href: "/teacher/qa", icon: MessageSquare },
];

export const OWNER_NAV_ITEMS = [
  { name: "Overview",    href: "/admin",              icon: LayoutDashboard },
  { name: "Authority Vault", href: "/owner/grievances", icon: Lock          },
  { name: "System Stats", href: "/admin/devices",     icon: Smartphone      },
];

export type UserRole = "student" | "admin" | "teacher" | "owner";

export function SidebarNavigation({ role = "student" }: { role?: UserRole }) {
  const pathname = usePathname();
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    // Read from cookie
    const getCookie = (name: string) => {
      if (typeof document === 'undefined') return '';
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return decodeURIComponent(parts.pop()?.split(';').shift() || '');
      return '';
    }
    const name = getCookie('user_name');
    if (name) setUserName(name);
  }, []);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  let items = STUDENT_NAV_ITEMS;
  if (role === "admin") items = ADMIN_NAV_ITEMS;
  if (role === "teacher") items = TEACHER_NAV_ITEMS;
  if (role === "owner") items = OWNER_NAV_ITEMS;

  return (
    <nav className="w-full bg-surface_container_lowest/70 backdrop-blur-sm border-b border-outline_variant/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Area */}
          <div className="flex-shrink-0 flex items-center gap-3">
             <img src="/BLUEMANTLE LOGO.png" alt="Bluemantle Logo" className="h-8 w-auto object-contain" />
             <span className="font-manrope font-bold text-lg hidden md:block text-on_surface">Bluemantle</span>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar mx-4 md:mx-8">
            <div className="flex space-x-1 sm:space-x-2">
              {items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 group whitespace-nowrap",
                      isActive 
                        ? "bg-secondary_container text-on_secondary_container font-semibold"
                        : "text-on_surface_variant hover:bg-surface_container_high hover:text-on_surface"
                    )}
                  >
                    <item.icon className={cn(
                      "w-4 h-4 transition-transform",
                      isActive ? "text-primary" : "text-outline group-hover:text-primary"
                    )} />
                    <span className="text-sm">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
          
          {/* Right Action Area - Config & Profile */}
          <div className="flex-shrink-0 flex items-center gap-4">
             < ThemeToggle />
             
             {/* Profile Dropdown (relative group) */}
             <div className="relative group">
                <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm cursor-pointer hover:bg-primary/20 transition-colors">
                   {getInitials(userName)}
                </div>
             
             {/* Dropdown Menu */}
             <div className="absolute right-0 mt-2 w-48 bg-surface_container_lowest border border-outline_variant/30 rounded-xl shadow-ambient opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pt-2 pb-2">
                <div className="px-4 py-2 border-b border-outline_variant/20 mb-2">
                  <p className="text-sm font-bold text-on_surface truncate">{userName}</p>
                  <p className="text-xs text-on_surface_variant capitalize">{role}</p>
                </div>
                {role === "student" && PROFILE_MENU_ITEMS.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-on_surface_variant hover:bg-surface_container_high hover:text-primary transition-colors"
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                ))}
                <Link
                  href="/"
                  onClick={() => {
                    // Clear cookies on logout
                    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                    document.cookie = "user_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                    document.cookie = "user_name=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                  }}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-error hover:bg-error/10 transition-colors mt-2 border-t border-outline_variant/20 pt-2"
                >
                  <UserCircle className="w-4 h-4" />
                  Sign Out
                </Link>
              </div>
             </div>
          </div>
          
        </div>
      </div>
    </nav>
  );
}
