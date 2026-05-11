"use client";

import { useState } from "react";
import { Video, CheckCircle, X, Info } from "lucide-react";
import { DeviceToggle } from "@/components/DeviceToggle";
import { apiRequest } from "@/lib/api";

export function LiveJoinManager({ sessionTitle, classId }: { sessionTitle?: string, classId?: string }) {
  const [isPreJoinOpen, setIsPreJoinOpen] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  const handleJoin = async () => {
    if (classId) {
      try {
        // Attendance will also be captured/synced via Zoom Webhooks, but we leave this here as a fallback
        await apiRequest("/classes/join-live", {
          method: "POST",
          body: JSON.stringify({ classId })
        });
        window.location.href = `/student/live/${classId}/zoom`;
      } catch (err) {
        console.error("Error joining session:", err);
        alert("Failed to connect to the session. Please try again.");
      }
    } else {
      alert("No class ID provided.");
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <button 
          onClick={() => setIsPreJoinOpen(true)}
          className="bg-primary hover:bg-primary_container text-on_primary px-8 py-4 rounded-full font-bold shadow-ambient transition-all flex items-center gap-2 text-lg hover:scale-105 active:scale-95"
        >
          <Video className="w-6 h-6" /> Join Live Session
        </button>
        <p className="text-sm text-outline_variant flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> Attendance auto-captured upon joining
        </p>
      </div>

      {isPreJoinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-surface_container_lowest w-full max-w-4xl rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,162,207,0.15)] border border-outline_variant/20 flex flex-col md:flex-row animate-in zoom-in-95 duration-300">
            
            {/* Left: Video Preview Area (Mock) */}
            <div className="md:w-2/3 bg-black relative flex items-center justify-center min-h-[300px] md:min-h-[500px]">
              {cameraActive ? (
                <div className="absolute inset-0 bg-surface_container_highest flex flex-col items-center justify-center text-on_surface_variant">
                  {/* Mocking a camera stream with a static UI message */}
                  <Video className="w-16 h-16 opacity-20 mb-4" />
                  <p className="font-bold">Camera starting...</p>
                  <p className="text-sm opacity-50 mt-1">Requesting permissions</p>
                </div>
              ) : (
                <div className="absolute inset-0 bg-surface_container flex flex-col items-center justify-center text-on_surface_variant">
                  <div className="w-24 h-24 rounded-full bg-surface_container_highest flex items-center justify-center mb-6 border border-outline_variant/20">
                     <span className="text-3xl font-bold">JD</span>
                  </div>
                  <p className="font-bold text-lg">Camera is off</p>
                </div>
              )}
              
              <div className="absolute bottom-6 left-0 w-full flex justify-center gap-6 z-10">
                <DeviceToggle type="mic" checked={micActive} onChange={setMicActive} />
                <DeviceToggle type="camera" checked={cameraActive} onChange={setCameraActive} />
              </div>
            </div>

            {/* Right: Settings and Join Control */}
            <div className="md:w-1/3 p-8 flex flex-col relative bg-surface_container_lowest">
              <button 
                onClick={() => setIsPreJoinOpen(false)}
                className="absolute top-6 right-6 text-on_surface_variant hover:text-on_surface p-2 bg-surface_container_high rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex-1">
                <h2 className="text-2xl font-bold font-manrope text-on_surface mb-2 mt-4">Ready to join?</h2>
                <p className="text-on_surface_variant text-sm mb-8">{sessionTitle || "Live Session"}</p>

                <div className="bg-surface_container_low p-4 rounded-xl border border-outline_variant/30 mb-6">
                   <div className="flex items-start gap-3">
                     <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                     <div>
                       <p className="font-bold text-sm text-on_surface mb-1">Privacy Controls</p>
                       <p className="text-xs text-on_surface_variant">You can adjust your camera and microphone using the animated toggles before entering the main class. Your choices are preserved.</p>
                     </div>
                   </div>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center text-sm border-b border-outline_variant/10 pb-2">
                    <span className="text-outline">Microphone</span>
                    <span className={micActive ? 'text-primary font-bold' : 'text-error font-bold'}>{micActive ? 'Active' : 'Muted'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-outline_variant/10 pb-2">
                    <span className="text-outline">Camera</span>
                    <span className={cameraActive ? 'text-primary font-bold' : 'text-error font-bold'}>{cameraActive ? 'Active' : 'Off'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button 
                  onClick={handleJoin}
                  className="w-full btn-premium py-4 font-bold text-lg hover:shadow-[0_0_40px_rgba(0,162,207,0.5)] transition-all flex items-center justify-center gap-2"
                >
                   Join Now
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
