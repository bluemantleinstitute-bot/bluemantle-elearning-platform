"use client";

import dynamic from "next/dynamic";

const DNABackground = dynamic(
  () => import("./DNABackground").then((module) => module.DNABackground),
  { ssr: false }
);

export function ClientOnlyDNABackground() {
  return <DNABackground />;
}
