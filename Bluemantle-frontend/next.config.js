/** @type {import('next').NextConfig} */

const apiOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").origin;
  } catch {
    return "http://localhost:5000";
  }
})();

const nextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    cpus: 1,
    workerThreads: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https://*.zoom.us https://source.zoom.us https://zoom.us https://www.youtube.com https://s.ytimg.com",
              "style-src 'self' 'unsafe-inline' https://*.zoom.us https://source.zoom.us https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.zoom.us https://zoom.us https://i.ytimg.com https://img.youtube.com https://cdn.plyr.io",
              "media-src 'self' blob: https://*.zoom.us https://www.youtube.com",
              `connect-src 'self' https://*.zoom.us https://zoom.us wss://*.zoom.us ${apiOrigin} https://cdn.plyr.io`,
              "frame-src 'self' https://zoom.us https://*.zoom.us https://www.youtube.com https://www.youtube-nocookie.com",
              "worker-src 'self' blob: https://*.zoom.us",
              "child-src 'self' blob: https://zoom.us https://*.zoom.us https://www.youtube.com https://www.youtube-nocookie.com",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
