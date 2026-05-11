"use client";

import React from "react";

/**
 * MarketHeartbeat Component
 * A premium ambient element representing the heartbeat of the market (ECG) 
 * paired with pulsing trading candles.
 * 
 * Optimized for SMOOTH LOOPING using a scanning mask effect.
 */
export function MarketHeartbeat() {
  return (
    <div className="fixed bottom-6 left-6 z-[60] pointer-events-none select-none animate-in fade-in slide-in-from-bottom-4 duration-1500">
      <div className="relative group flex flex-col items-start gap-1 p-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        
        {/* Vitality Label */}
        <div className="flex items-center gap-2 mb-0.5 px-1">
           <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse shadow-[0_0_8px_#00ff88]" />
           <span className="text-[9px] font-bold text-[#00ff88] opacity-60 tracking-[0.3em] uppercase">Sync Vitality</span>
        </div>

        <div className="market-vitality-canvas overflow-hidden rounded-xl bg-black/20">
          <svg viewBox="0 0 300 120" className="w-[200px] h-auto">
            <defs>
              {/* SCANNING GRADIENT MASK */}
              <linearGradient id="scanGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="50%" stopColor="white" stopOpacity="1" />
                <stop offset="60%" stopColor="white" stopOpacity="0.4" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>

              <mask id="scanMask">
                <rect x="-300" y="0" width="300" height="120" fill="url(#scanGradient)">
                  <animateTransform 
                    attributeName="transform" 
                    type="translate" 
                    from="0 0" 
                    to="600 0" 
                    dur="2.4s" 
                    repeatCount="indefinite" 
                  />
                </rect>
              </mask>

              {/* GLOW FILTER */}
              <filter id="glow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* STATIC BACKGROUND PATH */}
            <path 
              className="ecg-bg"
              d="M0 60 L60 60 C70 60, 75 50, 80 40 C85 30, 90 80, 100 60 L120 60 C130 60, 135 30, 145 15 C150 5, 155 110, 165 60 L300 60" 
              fill="none" stroke="rgba(0, 255, 136, 0.05)" strokeWidth="2"
            />

            {/* SCANNING FRONT PATH */}
            <path 
              className="ecg-pulse"
              d="M0 60 L60 60 C70 60, 75 50, 80 40 C85 30, 90 80, 100 60 L120 60 C130 60, 135 30, 145 15 C150 5, 155 110, 165 60 L300 60" 
              fill="none" stroke="#00ff88" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
              mask="url(#scanMask)"
              filter="url(#glow)"
            />

            {/* SYNCED CANDLES */}
            <g className="candle-pulse green">
              <line x1="145" y1="20" x2="145" y2="100" stroke="#00ff88" strokeWidth="2" />
              <rect x="135" y="45" width="20" height="30" fill="#00ff88" rx="4" filter="url(#glow)" />
            </g>

            <g className="candle-pulse red">
              <line x1="175" y1="30" x2="175" y2="95" stroke="#ff4d4f" strokeWidth="2" />
              <rect x="165" y="55" width="20" height="20" fill="#ff4d4f" rx="4" filter="url(#glow)" />
            </g>
          </svg>
        </div>

        {/* CSS FOR ORGANIC BEAT TIMING */}
        <style jsx>{`
          .candle-pulse {
            transform-origin: 155px 60px; /* Centered between the two candles approx */
            animation: organicBeat 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }

          .green { animation-delay: 0.8s; } /* Timing matches the ECG peak in the mask path */
          .red { animation-delay: 1.0s; }

          @keyframes organicBeat {
            0%, 60%, 100% { transform: scaleY(1) scaleX(1); opacity: 0.6; }
            70% { transform: scaleY(1.3) scaleX(1.1); opacity: 1; }
            80% { transform: scaleY(0.9) scaleX(0.95); opacity: 0.8; }
          }

          .ecg-pulse {
            stroke-dasharray: 2000; /* Ensuring full length coverage */
          }
        `}</style>
      </div>
    </div>
  );
}
