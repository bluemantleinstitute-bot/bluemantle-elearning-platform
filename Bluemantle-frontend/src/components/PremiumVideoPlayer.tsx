"use client";

import React, { useMemo, useEffect, useRef } from 'react';
import Plyr from "plyr";
import "plyr/dist/plyr.css";
import "@/styles/plyr-custom.css";

interface PremiumVideoPlayerProps {
  url: string; 
  title: string;
  onEnded?: () => void;
}

export function PremiumVideoPlayer({ url, title, onEnded }: PremiumVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Plyr | null>(null);

  const videoId = useMemo(() => {
    if (!url) return "";
    const cleanUrl = url.trim();
    if (cleanUrl.includes('youtu.be/')) return cleanUrl.split('youtu.be/')[1]?.split(/[?#]/)[0];
    if (cleanUrl.includes('embed/')) return cleanUrl.split('embed/')[1]?.split(/[?#]/)[0];
    if (cleanUrl.includes('v=')) return cleanUrl.split('v=')[1]?.split('&')[0];
    if (cleanUrl.length === 11 && !cleanUrl.includes('/') && !cleanUrl.includes('.')) return cleanUrl;
    return cleanUrl;
  }, [url]);

  useEffect(() => {
    if (!containerRef.current || !videoId) return;

    const player = new Plyr(containerRef.current, {
      controls: [
        'play-large', 'play', 'progress', 'current-time', 
        'mute', 'volume', 'settings', 'fullscreen'
      ],
      settings: ['quality', 'speed'],
      ratio: '16:9',
      youtube: {
        noCookie: true,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        modestbranding: 1
      },
      loadSprite: false,
    });

    player.on('ended', () => {
      if (onEnded) onEnded();
    });

    playerRef.current = player;

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId, onEnded]);

  if (!videoId) return <div className="aspect-video bg-black rounded-2xl animate-pulse" />;

  return (
    <div 
      className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-outline_variant/10 group"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="plyr__video-embed h-full w-full" ref={containerRef}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?iv_load_policy=3&modestbranding=1&playsinline=1&showinfo=0&rel=0&enablejsapi=1`}
          allowFullScreen
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          title={title}
          style={{ border: 0 }}
        ></iframe>
      </div>
    </div>
  );
}
