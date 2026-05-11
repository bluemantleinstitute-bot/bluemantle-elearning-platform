"use client";

import React, { useRef } from "react";
import "./PremiumUploadZone.css";

export function PremiumUploadZone() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div 
      className="cyber-dropzone" 
      onClick={() => fileInputRef.current?.click()}
    >
       {/* Input */}
       <input 
         type="file" 
         className="hidden" 
         ref={fileInputRef} 
         multiple 
         accept=".pdf,.docx,.epub"
       />

       {/* Floating Particles */}
       <div className="cyber-particle cyber-particle-1" />
       <div className="cyber-particle cyber-particle-2" />
       <div className="cyber-particle cyber-particle-3" />

       {/* 3D Folder */}
       <div className="cyber-folder">
          <div className="cyber-document" />
       </div>

       <h3 className="text-xl font-bold font-manrope text-on_surface mb-2 z-10 transition-transform duration-300 transform group-hover:-translate-y-2">
         Secure Payload Dropzone
       </h3>
       
       <p className="text-sm text-on_surface_variant mb-6 z-10">
         Drop encrypted archives or <span className="text-primary font-bold">Browse System</span>
       </p>
       
       <div className="z-10 text-[10px] text-outline uppercase font-bold tracking-widest border border-outline_variant/30 px-3 py-1.5 rounded-full bg-surface_container_lowest">
         PDF • DOCX • EPUB • XSLX
       </div>
    </div>
  );
}
