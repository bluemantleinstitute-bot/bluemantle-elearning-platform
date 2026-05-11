"use client";

import "./DashboardAmbience.css";

// Each tracer has a fixed position, size, opacity, and animation delay
const TRACERS = [
  // Left column
  { top: "15%",  left: "1%",   size: 65, opacity: 0.55, delay: "0s",    rotate: 0   },
  { top: "42%",  left: "0%",   size: 50, opacity: 0.35, delay: "0.4s",  rotate: 20  },
  { top: "72%",  left: "2%",   size: 40, opacity: 0.50, delay: "0.8s",  rotate: -15 },

  // Right column
  { top: "20%",  right: "1%",  size: 60, opacity: 0.50, delay: "0.2s",  rotate: 10  },
  { top: "55%",  right: "0%",  size: 45, opacity: 0.40, delay: "0.6s",  rotate: -25 },
  { top: "80%",  right: "2%",  size: 35, opacity: 0.30, delay: "1s",    rotate: 30  },

  // Scattered mid-left (partially visible)
  { top: "30%",  left: "-1%",  size: 75, opacity: 0.20, delay: "0.3s",  rotate: 45  },
  { top: "85%",  left: "0.5%", size: 30, opacity: 0.45, delay: "1.2s",  rotate: -30 },

  // Scattered mid-right
  { top: "10%",  right: "-1%", size: 80, opacity: 0.20, delay: "0.7s",  rotate: -10 },
  { top: "65%",  right: "1%",  size: 55, opacity: 0.35, delay: "0.9s",  rotate: 15  },
];

function PolylineTracer({ size, delay, rotate }: { size: number; delay: string; rotate: number }) {
  const half = size / 2;
  const pad = size * 0.25;
  // Diamond points: top, left, bottom, right, top
  const pts = `${half},${pad} ${pad},${half} ${half},${size - pad} ${size - pad},${half} ${half},${pad}`;

  return (
    <div
      className="polyline-loading"
      style={{ transform: `rotate(${rotate}deg)`, animationDelay: delay }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <polyline id="poly-back"  points={pts} />
        <polyline id="poly-front" points={pts} style={{ animationDelay: delay }} />
      </svg>
    </div>
  );
}

export function DashboardAmbience() {
  return (
    <>
      {/* Scattered Polyline Signal Tracers */}
      {TRACERS.map((t, i) => (
        <div
          key={i}
          className="fixed z-[2] pointer-events-none hidden xl:block"
          style={{
            top:     t.top,
            left:    (t as any).left,
            right:   (t as any).right,
            opacity: t.opacity,
          }}
          aria-hidden="true"
        >
          <PolylineTracer size={t.size} delay={t.delay} rotate={t.rotate} />
        </div>
      ))}

      {/* Morphing Orb — right mid */}
      <div
        className="fixed right-0 top-1/2 -translate-y-1/2 z-[2] opacity-50 pointer-events-none hidden xl:block translate-x-8"
        aria-hidden="true"
      >
        <div className="orb-loader">
          <svg width="0" height="0">
            <defs>
              <mask id="clipping-orb">
                <polygon points="50,10 90,90 10,90" fill="white" />
                <polygon points="50,10 90,90 10,90" fill="white" />
                <polygon points="10,10 90,10 50,90" fill="white" />
                <polygon points="10,10 90,10 50,90" fill="white" />
                <polygon points="50,5 95,95 5,95" fill="white" />
                <polygon points="5,5 95,5 50,95" fill="white" />
                <polygon points="50,5 95,95 5,95" fill="white" />
              </mask>
            </defs>
          </svg>
          <div className="box" />
        </div>
      </div>
    </>
  );
}
