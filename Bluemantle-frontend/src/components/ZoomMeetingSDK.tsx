"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Maximize2,
  RotateCcw,
  Shield,
  Video,
} from "lucide-react";
import { apiRequest } from "@/lib/api";

type ZoomClient = {
  init: (args: Record<string, unknown>) => Promise<unknown>;
  join: (args: Record<string, unknown>) => Promise<unknown>;
  leaveMeeting?: () => Promise<unknown>;
  destroyClient?: () => void;
  on?: (event: string, callback: (payload: unknown) => void) => void;
  off?: (event: string, callback: (payload: unknown) => void) => void;
};

type ZoomConnectionPayload = {
  state?: "Connected" | "Closed" | "Fail" | string;
  reason?: string;
};

interface ZoomMeetingProps {
  classId: string;
  meetingNumber: string;
  password?: string;
  userName: string;
  userEmail: string;
  role: number;
  leaveUrl: string;
  zoomJoinUrl?: string;
  zoomStartUrl?: string;
  topic?: string;
  duration?: number;
}

const describeZoomError = (error: unknown) => {
  if (!error) return "Zoom could not start. Please try again.";
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    const parsed = JSON.stringify(error);
    return parsed === "{}" ? "Zoom could not start. Please try again." : parsed;
  } catch {
    return "Zoom could not start. Please try again.";
  }
};

export default function ZoomMeetingSDK({
  classId,
  meetingNumber,
  password,
  userName,
  userEmail,
  role,
  leaveUrl,
  zoomJoinUrl,
  zoomStartUrl,
  topic,
  duration,
}: ZoomMeetingProps) {
  const zoomRootRef = useRef<HTMLDivElement | null>(null);
  const clientRef = useRef<ZoomClient | null>(null);
  const mountedRef = useRef(true);
  const [status, setStatus] = useState<"booting" | "joining" | "connected" | "closed" | "error">("booting");
  const [error, setError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isHost = role === 1;
  const externalZoomUrl = isHost ? zoomStartUrl || zoomJoinUrl : zoomJoinUrl;
  const cleanedMeetingNumber = useMemo(() => String(meetingNumber || "").replace(/\D/g, ""), [meetingNumber]);
  const displayName = useMemo(() => (userName || (isHost ? "Faculty" : "Student")).trim(), [isHost, userName]);

  const openExternalZoom = useCallback(() => {
    if (externalZoomUrl) {
      window.open(externalZoomUrl, "_blank", "noopener,noreferrer");
    }
  }, [externalZoomUrl]);

  const leaveRoom = useCallback(async () => {
    try {
      await clientRef.current?.leaveMeeting?.();
    } catch {
      // The SDK may already be disconnected. Navigation is still the desired result.
    } finally {
      window.location.href = leaveUrl;
    }
  }, [leaveUrl]);

  const enterFullscreen = useCallback(async () => {
    const root = zoomRootRef.current;
    if (!root || !document.fullscreenEnabled) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await root.requestFullscreen();
      }
    } catch {
      setError("Fullscreen is blocked by the browser for this tab.");
    }
  }, []);

  const startEmbeddedMeeting = useCallback(async () => {
    if (!classId || !cleanedMeetingNumber || !zoomRootRef.current) {
      setStatus("error");
      setError("This class is missing Zoom meeting data. Please recreate the session or contact admin.");
      return;
    }

    setStatus("joining");
    setError("");

    try {
      const [{ default: ZoomMtgEmbedded }, signatureRes] = await Promise.all([
        import("@zoom/meetingsdk/embedded"),
        apiRequest("/zoom/generate-signature", {
          method: "POST",
          body: JSON.stringify({
            classId,
            meetingNumber: cleanedMeetingNumber,
            role: isHost ? 1 : 0,
          }),
        }),
      ]);

      if (!mountedRef.current) return;
      if (!signatureRes.success || !signatureRes.signature) {
        throw new Error(signatureRes.message || "Unable to authorize this Zoom session.");
      }

      if (clientRef.current?.leaveMeeting) {
        await clientRef.current.leaveMeeting().catch(() => undefined);
      }

      const client = ZoomMtgEmbedded.createClient() as unknown as ZoomClient;
      clientRef.current = client;

      const handleConnectionChange = (payload: unknown) => {
        const connection = (payload || {}) as ZoomConnectionPayload;
        if (connection.state === "Connected") setStatus("connected");
        if (connection.state === "Closed") setStatus("closed");
        if (connection.state === "Fail") {
          setStatus("error");
          setError(describeZoomError(connection));
        }
      };

      client.on?.("connection-change", handleConnectionChange);

      await client.init({
        zoomAppRoot: zoomRootRef.current,
        language: "en-US",
        patchJsMedia: true,
        leaveOnPageUnload: true,
        customize: {
          meetingInfo: ["topic", "host", "mn", "participant"],
          video: {
            isResizable: true,
            viewSizes: {
              default: { width: 1100, height: 650 },
              ribbon: { width: 420, height: 240 },
            },
            defaultViewType: "speaker",
          },
          participants: {
            popper: { disableDraggable: false },
          },
          chat: {
            popper: { disableDraggable: false },
          },
        },
      });

      const joinOptions: Record<string, unknown> = {
        signature: signatureRes.signature,
        sdkKey: signatureRes.sdkKey,
        meetingNumber: signatureRes.meetingNumber || cleanedMeetingNumber,
        password: signatureRes.password ?? password ?? "",
        userName: displayName,
        userEmail: userEmail || undefined,
      };

      if (isHost && signatureRes.zak) {
        joinOptions.zak = signatureRes.zak;
      }

      await client.join(joinOptions);
      if (mountedRef.current) setStatus("connected");
    } catch (err) {
      console.error("Embedded Zoom failed:", err);
      if (!mountedRef.current) return;
      setStatus("error");
      setError(describeZoomError(err));
    }
  }, [classId, cleanedMeetingNumber, displayName, isHost, password, userEmail]);

  useEffect(() => {
    mountedRef.current = true;
    startEmbeddedMeeting();

    const fullscreenHandler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", fullscreenHandler);

    return () => {
      mountedRef.current = false;
      document.removeEventListener("fullscreenchange", fullscreenHandler);
      clientRef.current?.leaveMeeting?.().catch(() => undefined);
    };
  }, [startEmbeddedMeeting]);

  const busy = status === "booting" || status === "joining";

  return (
    <div className="min-h-screen bg-[#071019] text-white">
      <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#08131f]/95 px-4 py-3 backdrop-blur md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={leaveRoom}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
            aria-label="Leave classroom"
            title="Leave classroom"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white md:text-base">{topic || "Live Classroom"}</p>
            <p className="mt-0.5 text-xs text-slate-400">
              {isHost ? "Faculty host" : "Student participant"}
              {duration ? ` - ${duration} min` : ""}
              {cleanedMeetingNumber ? ` - Meeting ${cleanedMeetingNumber}` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 sm:flex">
            {status === "connected" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : status === "error" ? (
              <AlertCircle className="h-4 w-4 text-red-400" />
            ) : (
              <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
            )}
            {status === "connected" ? "Connected" : status === "error" ? "Needs attention" : "Joining"}
          </div>
          <button
            type="button"
            onClick={enterFullscreen}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          {externalZoomUrl && (
            <button
              type="button"
              onClick={openExternalZoom}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
              aria-label="Open in Zoom"
              title="Open in Zoom"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      <main className="grid min-h-[calc(100vh-4rem)] grid-rows-[1fr_auto]">
        <section className="relative min-h-[560px] overflow-hidden bg-black">
          <div ref={zoomRootRef} className="absolute inset-0 h-full w-full bg-black" />

          {busy && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#071019]">
              <div className="w-full max-w-sm px-6 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10">
                  <Loader2 className="h-8 w-8 animate-spin text-cyan-300" />
                </div>
                <h1 className="text-xl font-semibold text-white">Opening secure classroom</h1>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  We are validating access, signing the Zoom room, and loading the embedded client.
                </p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#071019] p-6">
              <div className="w-full max-w-lg rounded-lg border border-red-400/25 bg-[#111b26] p-6 text-center shadow-2xl">
                <AlertCircle className="mx-auto h-12 w-12 text-red-300" />
                <h1 className="mt-4 text-xl font-semibold text-white">Classroom could not open</h1>
                <p className="mt-3 text-sm leading-6 text-slate-300">{error}</p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <button
                    type="button"
                    onClick={startEmbeddedMeeting}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Retry embedded room
                  </button>
                  {externalZoomUrl && (
                    <button
                      type="button"
                      onClick={openExternalZoom}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open Zoom app
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {status === "closed" && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#071019] p-6">
              <div className="w-full max-w-md rounded-lg border border-white/10 bg-[#111b26] p-6 text-center">
                <Video className="mx-auto h-12 w-12 text-cyan-300" />
                <h1 className="mt-4 text-xl font-semibold text-white">Meeting closed</h1>
                <p className="mt-2 text-sm text-slate-400">You can return to your dashboard or reconnect if the session is still active.</p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <button
                    type="button"
                    onClick={leaveRoom}
                    className="rounded-lg bg-white px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-200"
                  >
                    Return
                  </button>
                  <button
                    type="button"
                    onClick={startEmbeddedMeeting}
                    className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                  >
                    Reconnect
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-[#08131f] px-4 py-3 text-xs text-slate-400 md:px-6">
          <span className="inline-flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-300" />
            Access is verified server-side before a Zoom signature is issued.
          </span>
          <span className="truncate">Signed in as {displayName}</span>
        </footer>
      </main>
    </div>
  );
}
