"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ShieldAlert, Lock } from "lucide-react";
import { SessionManager } from "./SessionManager";

export function SecurityGuard({ children }: { children: React.ReactNode }) {
  const [isSecure, setIsSecure] = useState(true);
  const [securityMessage, setSecurityMessage] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  const isStudentRoute = pathname?.startsWith("/student");

  useEffect(() => {
    if (!isStudentRoute) return;
    // 1. Disable Right-Click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // 2. Disable Selection & Copy
    const handleKeydown = (e: KeyboardEvent) => {
      // Block Ctrl+C, Ctrl+V, Ctrl+U, F12, Ctrl+Shift+I, Ctrl+Shift+J
      if (
        (e.ctrlKey && (e.key === 'c' || e.key === 'u' || e.key === 's' || e.key === 'a' || e.key === 'p')) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C'))
      ) {
        e.preventDefault();
        setSecurityMessage("Security Policy: This action is restricted.");
        setTimeout(() => setSecurityMessage(""), 3000);
        return false;
      }
    };

    // 3. Tab Visibility Monitoring
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Blur or pause logic can go here
        // We set a subtle state but don't kick user out immediately
      }
    };

    // 4. DevTools Detection & Auto-Logout
    const detectDevTools = () => {
      const threshold = 160;
      const isDevToolsOpen = 
        window.outerWidth - window.innerWidth > threshold || 
        window.outerHeight - window.innerHeight > threshold;
      
      if (isDevToolsOpen) {
         setSecurityMessage("Security Policy: Developer tools detected. Logging out...");
         setTimeout(() => {
           document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
           document.cookie = "user_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
           document.cookie = "user_name=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
           localStorage.removeItem("bluemantle_session");
           window.location.href = "/"; // Force hard redirect to login
         }, 1500);
      }
    };

    // Periodic check
    const devToolsInterval = setInterval(detectDevTools, 2000);

    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeydown);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("resize", detectDevTools);

    return () => {
      clearInterval(devToolsInterval);
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeydown);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("resize", detectDevTools);
    };
  }, [isStudentRoute]);

  if (!isStudentRoute) {
    return <>{children}</>;
  }

  return (
    <div className="relative select-none">
      <SessionManager />
      {/* Security Message Toast */}
      {securityMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[10000] bg-error text-on_error px-6 py-3 rounded-full shadow-ambient flex items-center gap-3 animate-bounce">
          <ShieldAlert className="w-5 h-5" />
          <span className="font-bold text-sm">{securityMessage}</span>
        </div>
      )}

      {/* Security Blur Overlay (If DevTools detected or Tab hidden) */}
      {!isSecure && (
        <div className="fixed inset-0 z-[10001] bg-surface/80 backdrop-blur-3xl flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 bg-error/10 text-error rounded-3xl flex items-center justify-center mb-6">
            <Lock className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-manrope font-bold mb-4 text-on_surface">Security Violation Detected</h2>
          <p className="text-on_surface_variant max-w-md mb-8">
            Our system has detected an attempt to access developer tools or inspect the application source code. Your session has been temporarily suspended for protection.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-primary text-on_primary px-8 py-3 rounded-full font-bold shadow-ambient"
          >
            Re-verify Session
          </button>
        </div>
      )}

      {/* Blur screen when tab is inactive (Premium Feel) */}
      <div className="visibility-blur-wrapper transition-all duration-500">
         <style jsx global>{`
            @media (prefers-reduced-motion: no-preference) {
              body:has(input:focus) { /* focus check */ }
            }
            .inactive-blur {
              filter: blur(20px);
            }
         `}</style>
         {children}
      </div>
    </div>
  );
}
