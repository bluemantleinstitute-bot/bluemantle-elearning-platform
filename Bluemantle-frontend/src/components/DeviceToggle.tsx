"use client";

import React from "react";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";
import "./DeviceToggle.css";

interface DeviceToggleProps {
  type: "mic" | "camera";
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function DeviceToggle({ type, checked, onChange }: DeviceToggleProps) {
  return (
    <label className={`device-toggle-container ${checked ? 'is-active' : 'is-inactive'}`}>
      <input 
        type="checkbox" 
        checked={checked} 
        onChange={(e) => onChange(e.target.checked)} 
      />
      
      {type === "mic" ? (
         <>
           <MicOff className="device-off w-6 h-6" />
           <Mic className="device-on w-6 h-6" />
         </>
      ) : (
         <>
           <VideoOff className="device-off w-6 h-6" />
           <Video className="device-on w-6 h-6" />
         </>
      )}
    </label>
  );
}
