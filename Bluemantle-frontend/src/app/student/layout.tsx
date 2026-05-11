import { AppShell } from "@/components/AppShell";
import { SecurityGuard } from "@/components/SecurityGuard";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SecurityGuard>
      <AppShell title="Student Dashboard">{children}</AppShell>
    </SecurityGuard>
  );
}
