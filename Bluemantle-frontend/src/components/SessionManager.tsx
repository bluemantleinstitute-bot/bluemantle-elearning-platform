"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export function SessionManager() {
  const router = useRouter();
  const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 minutes

  const logout = useCallback(() => {
    // Clear cookies on session expiry
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "user_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "user_name=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    localStorage.removeItem("bluemantle_session");
    window.location.href = "/";
  }, []);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(logout, INACTIVITY_LIMIT);
    };

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    events.forEach((event) => document.addEventListener(event, resetTimer));

    resetTimer();

    return () => {
      events.forEach((event) => document.removeEventListener(event, resetTimer));
      clearTimeout(timeout);
    };
  }, [logout, INACTIVITY_LIMIT]);

  return null;
}
