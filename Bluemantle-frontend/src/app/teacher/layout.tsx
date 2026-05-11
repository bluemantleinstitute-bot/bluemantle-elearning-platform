import { AppShell } from "@/components/AppShell";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell title="Teacher Portal" role="teacher">{children}</AppShell>;
}
