import { DashboardHeader } from "@/components/features/dashboard-header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="container flex-1 py-6">{children}</main>
    </div>
  );
}
