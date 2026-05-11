"use client";

import "./MotivationalSpinner.css";

export function MotivationalSpinner() {
  return (
    <div className="motivational-card animate-in fade-in zoom-in duration-700">
      <div className="motivational-loader">
        <span className="text-on_surface_variant tracking-[0.2em] uppercase text-[10px] font-bold mr-3 opacity-60 whitespace-nowrap">
          Your success demands
        </span>
        <div className="motivational-words">
          <span className="motivational-word">STRATEGY.</span>
          <span className="motivational-word">FOCUS.</span>
          <span className="motivational-word">DISCIPLINE.</span>
          <span className="motivational-word">CONSISTENCY.</span>
          <span className="motivational-word">PATIENCE.</span>
          <span className="motivational-word">MASTERY.</span>
          <span className="motivational-word">STRATEGY.</span>
        </div>
      </div>
    </div>
  );
}
