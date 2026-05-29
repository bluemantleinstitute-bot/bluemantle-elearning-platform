"use client";

const DEVICE_ID_KEY = "bluemantle_device_id_v1";

const hashString = (value: string) => {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
};

const makeDeviceId = () => {
  const nav = window.navigator;
  const screenData = window.screen;
  const stableParts = [
    nav.userAgent,
    nav.language,
    nav.platform,
    String(nav.hardwareConcurrency || ""),
    String((nav as Navigator & { deviceMemory?: number }).deviceMemory || ""),
    Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    `${screenData.width}x${screenData.height}`,
    `${screenData.colorDepth}`,
    `${window.devicePixelRatio || 1}`,
  ];

  return `bmit-device-v2:${hashString(stableParts.join("|"))}`;
};

export function getStableDeviceId() {
  if (typeof window === "undefined") return "";

  try {
    const existing = window.localStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;

    const nextDeviceId = makeDeviceId();
    window.localStorage.setItem(DEVICE_ID_KEY, nextDeviceId);
    return nextDeviceId;
  } catch {
    return makeDeviceId();
  }
}
